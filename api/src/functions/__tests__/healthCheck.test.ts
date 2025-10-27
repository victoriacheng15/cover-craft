import { describe, it, expect, vi } from 'vitest';
import { healthCheck } from '../healthCheck';
import { HttpRequest, InvocationContext } from '@azure/functions';

describe('healthCheck', () => {
  // Mock InvocationContext
  const mockContext = {
    log: vi.fn(),
  } as unknown as InvocationContext;

  // Mock HttpRequest
  const mockRequest = {
    url: 'http://localhost:7071/api/healthCheck',
  } as unknown as HttpRequest;

  it('should return status 200', async () => {
    const response = await healthCheck(mockRequest, mockContext);
    expect(response.status).toBe(200);
  });

  it('should have correct Content-Type header', async () => {
    const response = await healthCheck(mockRequest, mockContext);
    expect(response.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('should return JSON with localTime and isoTime fields', async () => {
    const response = await healthCheck(mockRequest, mockContext);
    const body = JSON.parse(response.body as string);
    expect(body).toHaveProperty('localTime');
    expect(body).toHaveProperty('isoTime');
  });

  it('should return valid ISO time format', async () => {
    const response = await healthCheck(mockRequest, mockContext);
    const body = JSON.parse(response.body as string);
    expect(() => new Date(body.isoTime)).not.toThrow();
    expect(body.isoTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
