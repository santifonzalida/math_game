import { formatTime } from './format-time';

describe('formatTime', () => {
  it.each([
    [0, '0:00.00'],
    [1234, '0:01.23'],
    [83456, '1:23.45'],
    [600000, '10:00.00'],
  ])('formats %d ms as %s', (ms, expected) => {
    expect(formatTime(ms)).toBe(expected);
  });
});
