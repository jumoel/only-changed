const { bucketFiles } = require('./bucketFiles');

describe('bucketFiles', () => {
	it('works for empty arrays', () => {
		expect(bucketFiles([], 0)).toEqual([[]]);
		expect(bucketFiles([], 1)).toEqual([[]]);
	});

	it('works for things under the limit', () => {
		expect(bucketFiles(['123'], 3)).toEqual([['123']]);
		expect(bucketFiles(['123', '456'], 7)).toEqual([['123', '456']]);
	});

	it('works for things over the limit', () => {
		expect(bucketFiles(['123', '456'], 3)).toEqual([['123'], ['456']]);
	});

	it('works with individual things over the limit', () => {
		expect(bucketFiles(['123'], 1)).toEqual([['123']]);
	});
});
