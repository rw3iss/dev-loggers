
export const executePromisesSequentially = async (promises: (() => Promise<any>)[]): Promise<any[]> => {
	const results: any[] = [];
	for (const promiseFactory of promises) {
		const result = await promiseFactory(); // Await each promise before proceeding
		results.push(result);
	}
	return results;
}
