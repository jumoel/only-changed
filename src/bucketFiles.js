export function bucketFiles(files, remainingLength) {
	return files.reduce(
		(buckets, file) => {
			let lastArrayIndex = buckets.length - 1;
			const lastArrayStringLength = buckets[lastArrayIndex].join(' ').length;

			if (
				lastArrayStringLength + file.length > remainingLength &&
				lastArrayStringLength > 0
			) {
				buckets.push([]);
				lastArrayIndex += 1;
			}

			buckets[lastArrayIndex].push(file);

			return buckets;
		},
		[[]],
	);
}
