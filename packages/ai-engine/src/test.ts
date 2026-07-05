import { AIEngineService } from './ai-engine.service.js';
import { ParsedSymbol } from './types.js';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not set in .env');
  }

  const engine = new AIEngineService(apiKey);

const testSymbol: ParsedSymbol = {
  name: 'processPayment',
  kind: 'function',
  startLine: 1,
  endLine: 25,
  filePath: 'src/payments/payment.service.ts',
  code: `
async function processPayment(orderId: string, amount: number, method: string) {
  if (amount <= 0) throw new Error('Invalid amount');
  
  const order = await db.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) return { success: false, reason: 'ORDER_NOT_FOUND' };
  if (order.status === 'paid') return { success: false, reason: 'ALREADY_PAID' };
  
  let result;
  if (method === 'stripe') {
    result = await stripe.charges.create({ amount, currency: 'usd' });
  } else if (method === 'paypal') {
    result = await paypal.payment.create({ amount });
  } else {
    throw new Error('Unsupported payment method');
  }
  
  await db.orders.update({ where: eq(orders.id, orderId), data: { status: 'paid' } });
  return { success: true, transactionId: result.id };
}`,
};

  try {
    const documentationResult = await engine.documentSymbol(testSymbol);
    console.log('✅ Documentation generated!');
    console.log('📄 Markdown output:', documentationResult.markdown);
    if (documentationResult.mermaidDiagram) {
      console.log('📊 Mermaid Diagram:', documentationResult.mermaidDiagram);
    }
    console.log('💰 Tokens used:', documentationResult.tokensUsed);
  } catch (error) {
    console.error('❌ Error generating documentation:', error);
  }
}

main().catch(console.error);
