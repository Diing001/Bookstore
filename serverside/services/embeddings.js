let extractorPromise = null;

// load the model once, the first time it's needed
const getExtractor = () => {
  if (!extractorPromise) {
    extractorPromise = import("@huggingface/transformers").then(({ pipeline }) =>
      pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2")
    );
  }
  return extractorPromise;
};

// text in → 384 numbers out
exports.embed = async (text) => {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
};