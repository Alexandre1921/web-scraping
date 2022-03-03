const createBatches = (DataToSave, chunkSizeToBatch = 800) => {
  const arrayLength = Math.ceil(DataToSave.length / chunkSizeToBatch);
  const splittedArrays = new Array(arrayLength).fill(undefined).map((_, i) => {
      const cursor = i * chunkSizeToBatch;
      const nextCursor = cursor + chunkSizeToBatch;
      const splittedArray = DataToSave.slice(cursor, nextCursor);
      return splittedArray;
  });
  return splittedArrays;
}

module.exports = createBatches;