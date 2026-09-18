export default function handler(req, res) {
  return res.status(200).json({
    native_node_works: true,
    node_version: process.version
  });
}
