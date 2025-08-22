/**
 * Test simple pour vérifier que Jest est correctement configuré
 */

describe('Jest Configuration Test', () => {
  test('Jest should be able to run basic tests', () => {
    expect(true).toBe(true);
  });

  test('Basic math operations should work', () => {
    expect(1 + 1).toBe(2);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(15 / 3).toBe(5);
  });

  test('String operations should work', () => {
    const str = 'Hello Jest';
    expect(str).toContain('Jest');
    expect(str.length).toBe(10);
    expect(str.toLowerCase()).toBe('hello jest');
  });

  test('Array operations should work', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toHaveLength(5);
    expect(arr).toContain(3);
    expect(arr[0]).toBe(1);
  });

  test('Object operations should work', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Test');
    expect(obj).toEqual({ name: 'Test', value: 42 });
  });

  test('Async operations should work', async () => {
    const asyncFunc = () => Promise.resolve('success');
    const result = await asyncFunc();
    expect(result).toBe('success');
  });
});