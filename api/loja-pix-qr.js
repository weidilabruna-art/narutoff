export default async function handler(req, res) {
  const text = req.query.text || '';
  if (!text) {
    return res.status(400).end();
  }

  try {
    const fetchResponse = await fetch(`https://quickchart.io/qr?size=250x250&text=${encodeURIComponent(text)}`);
    const buffer = await fetchResponse.arrayBuffer();

    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(buffer));
  } catch (error) {
    return res.status(500).end();
  }
}
