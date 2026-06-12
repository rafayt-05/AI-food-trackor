const express = require('express');
const { NGO } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  const ngos = await NGO.findAll();
  res.json(ngos);
});

router.post('/', async (req, res) => {
  const data = req.body;
  const ngo = await NGO.create(data);
  res.json(ngo);
});

router.post('/:id/verify', async (req, res) => {
  const ngo = await NGO.findByPk(req.params.id);
  if (!ngo) return res.status(404).send('Not found');
  ngo.verified = true;
  await ngo.save();
  res.json(ngo);
});

module.exports = router;
