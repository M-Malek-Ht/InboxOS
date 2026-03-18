declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jest: any;

import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'ANTHROPIC_API_KEY') return 'test-key';
        if (key === 'ANTHROPIC_MODEL') return 'claude-sonnet-4-20250514';
        return undefined;
      }),
    } as any;

    service = new AiService(config);
  });

  it('parses classify JSON wrapped in markdown', async () => {
    jest.spyOn(service as any, 'createUserMessage').mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '```json\n{"category":"Work","priorityScore":75,"needsReply":true,"tags":["urgent"],"summary":"ok"}\n```',
        },
      ],
    });

    const result = await service.classifyEmail({
      from: 'person@example.com',
      subject: 'Question',
      body: 'Please respond',
    });

    expect(result).toEqual({
      category: 'Work',
      priorityScore: 75,
      needsReply: true,
      tags: ['urgent'],
      summary: 'ok',
    });
  });

  it('throws on invalid classify response JSON', async () => {
    jest.spyOn(service as any, 'createUserMessage').mockResolvedValue({
      content: [{ type: 'text', text: 'not-json' }],
    });

    await expect(
      service.classifyEmail({ from: 'x', subject: 'y', body: 'z' }),
    ).rejects.toThrow(/Invalid JSON/);
  });

  it('truncates very large prompt inputs before draft generation', async () => {
    const spy = jest.spyOn(service as any, 'createUserMessage').mockResolvedValue({
      content: [{ type: 'text', text: 'Hi there' }],
    });

    await service.generateDraft(
      {
        from: 'sender@example.com',
        subject: 'Subject',
        body: 'x'.repeat(20000),
      },
      {
        tone: 'Professional',
        length: 'Short',
        instruction: 'i'.repeat(2000),
      },
    );

    const [prompt] = spy.mock.calls[0];
    expect(prompt).toContain('[truncated]');
  });
});
