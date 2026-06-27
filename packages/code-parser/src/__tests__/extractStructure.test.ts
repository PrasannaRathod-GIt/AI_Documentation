import test from 'node:test';
import assert from 'node:assert/strict';
import { extractStructure } from '../extractStructure';

test('extractStructure returns structured symbols for TypeScript source', () => {
  const source = `
    import { Injectable } from '@nestjs/common';

    /** Service for orders */
    @Injectable()
    export class OrderService {
      constructor(private readonly repository: OrderRepository) {}

      public findById(id: string): Promise<Order | null> {
        return this.repository.findById(id);
      }

      private buildQuery(): string {
        return 'query';
      }
    }

    export interface Order {
      id: string;
      total: number;
    }

    export type OrderStatus = 'pending' | 'complete';

    export function formatOrder(order: Order): string {
      return order.id;
    }
  `;

  const result = extractStructure(source, 'src/orders.ts');

  assert.equal(result.language, 'typescript');
  assert.equal(result.filePath, 'src/orders.ts');
  assert.equal(result.symbols.length, 4);

  const classSymbol = result.symbols.find((symbol) => symbol.type === 'class');
  assert.ok(classSymbol);
  assert.equal(classSymbol?.name, 'OrderService');
  assert.equal(classSymbol?.startLine, 5);
  assert.ok(classSymbol?.endLine && classSymbol.endLine >= classSymbol.startLine);
  assert.match(classSymbol?.signature ?? '', /class OrderService/);
  assert.doesNotMatch(classSymbol?.signature ?? '', /return this\.repository\.findById/);

  const functionSymbol = result.symbols.find((symbol) => symbol.type === 'function');
  assert.ok(functionSymbol);
  assert.equal(functionSymbol?.name, 'formatOrder');
  assert.match(functionSymbol?.signature ?? '', /formatOrder/);
  assert.doesNotMatch(functionSymbol?.signature ?? '', /return order\.id/);
});
