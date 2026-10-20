import {
  QuickCaptureRequestSchema,
  SummarizeRequestSchema,
  PlanDayRequestSchema,
  OrganizeFilesRequestSchema
} from '../server/ai/schemas.js';
import { SimulatedProvider } from '../server/ai/simulated.js';
import { AiService } from '../server/ai/service.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 Running LazyFlow AI Automated Service & Schema Tests');
  console.log('=======================================================\n');

  // Test 1: Quick Capture Schema Validation
  console.log('Test Suite 1: Zod Input Validation Schemas');
  const validCapture = QuickCaptureRequestSchema.safeParse({
    text: 'finish dbms assignment by friday, email team tomorrow',
  });
  assert(validCapture.success, 'Valid quick capture payload succeeds');

  const invalidCapture = QuickCaptureRequestSchema.safeParse({ text: 'a' });
  assert(!invalidCapture.success, 'Short quick capture payload (< 3 chars) is rejected');

  const validSummarize = SummarizeRequestSchema.safeParse({
    text: 'This is a test article with enough text content to summarize properly.',
    mode: 'key_points',
  });
  assert(validSummarize.success, 'Valid summarize payload with mode succeeds');

  const invalidPlan = PlanDayRequestSchema.safeParse({
    tasks: [],
    availableHours: 4,
  });
  assert(!invalidPlan.success, 'Empty task array in plan-day is rejected');
  console.log('');

  // Test 2: SimulatedProvider Task Extraction & Date Parsing
  console.log('Test Suite 2: Simulated Gemma Open-Weight Heuristics');
  const provider = new SimulatedProvider();

  const rawNotes = 'finish dbms assignment by friday, prepare for viva, email team about meeting tomorrow';
  const captureResult = await provider.quickCapture(rawNotes);

  assert(captureResult.tasks.length >= 3, `Extracted ${captureResult.tasks.length} tasks from prompt`);
  assert(captureResult.meta.isSimulated === true, 'Response correctly flagged as isSimulated');
  assert(
    captureResult.tasks.some(t => t.category === 'study' || t.category === 'engineering'),
    'Appropriately categorized study/engineering tasks'
  );

  // Test 3: Summarizer Modes
  console.log('\nTest Suite 3: Summarization Engine');
  const docText = `LazyFlow AI is built for Hacktoberfest 2026 Week 3 Challenge "Slow and Steady". It prioritizes developer wellness and cognitive longevity by automating monotonous formatting and scheduling chores with open-source Gemma 2.`;
  const summaryResult = await provider.summarize(docText, 'key_points');

  assert(summaryResult.keyPoints !== undefined && summaryResult.keyPoints.length > 0, 'Extracted key points');
  assert(summaryResult.readingTimeMinutes >= 1, 'Estimated reading time calculated');

  // Test 4: Daily Planner ("Slow and Steady" Pacing)
  console.log('\nTest Suite 4: Daily Planner & Break Generation');
  const testTasks = [
    { id: '1', title: 'Complete DBMS assignment', priority: 'high' as const, estimatedMinutes: 45 },
    { id: '2', title: 'Review Viva questions', priority: 'high' as const, estimatedMinutes: 40 },
    { id: '3', title: 'Team email update', priority: 'medium' as const, estimatedMinutes: 20 },
  ];

  const planResult = await provider.planDay(testTasks, 4, 'medium', '09:00', 'balanced');

  assert(planResult.blocks.length >= 3, `Generated ${planResult.blocks.length} schedule blocks`);
  const hasBreaks = planResult.blocks.some(b => b.type === 'break');
  assert(hasBreaks, 'Incorporated deliberate restorative breaks ("Slow and Steady")');
  assert(Boolean(planResult.pacingRationale), 'Included cognitive load pacing rationale');

  // Test 5: File Organizer Standardization
  console.log('\nTest Suite 5: File Taxonomy & ISO-8601 Renamer');
  const testFiles = [
    { name: 'IMG_202610_final_v2_FINAL(1).png' },
    { name: 'notes_dbms_sep2026.txt' }
  ];

  const fileResult = await provider.organizeFiles(testFiles, 'Student Coursework');
  assert(fileResult.suggestions.length === 2, 'Generated 2 file suggestions');
  assert(
    fileResult.suggestions[0].suggestedName.startsWith('2026-'),
    'Prefixed with standardized ISO year'
  );
  assert(
    fileResult.recommendedDirectoryTree.length > 0,
    'Constructed recommended directory taxonomy'
  );

  // Test 6: AiService Fallback Handling
  console.log('\nTest Suite 6: AiService Provider Orchestration');
  const aiService = new AiService();
  const serviceStatus = await aiService.getStatus('http://127.0.0.1:99999'); // Non-existent port
  assert(serviceStatus.connected === false, 'Detects offline Ollama port gracefully without throwing');
  assert(serviceStatus.instructions.offlineCapable === true, 'Status contains offline capability docs');

  // Fallback extraction test
  const fallbackRes = await aiService.quickCapture('test task 1, test task 2', 'ollama');
  assert(fallbackRes.tasks.length >= 2, 'Gracefully falls back to simulated Gemma when Ollama is offline');

  console.log('\n=======================================================');
  console.log(`Test Summary: ${passed} passed, ${failed} failed`);
  console.log('=======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Unhandled test runner error:', err);
  process.exit(1);
});
