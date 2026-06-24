import { ResponseDto } from './response.dto';

describe('ResponseDto', () => {
  it('wraps payload in data property', () => {
    const payload = { id: '1', name: 'Example' };

    const response = new ResponseDto(payload);

    expect(response.data).toEqual(payload);
  });
});
