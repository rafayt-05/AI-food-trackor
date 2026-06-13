const express = require('express');
const { Offer } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// list offers
router.get('/', async (req, res) => {
  const offers = await Offer.findAll({ order: [['createdAt','DESC']] });
  res.json(offers);
});

// create offer (authenticated)
router.post('/', auth, async (req, res) => {
  const data = req.body;
  try{
    // ensure userId comes from token
    data.userId = req.user.id;
    const offer = await Offer.create(data);
    res.status(201).json(offer);
  }catch(err){res.status(400).json({ error: err.message })}
});

// delete offer
router.delete('/:id', auth, async (req, res) => {
  const id = req.params.id;
  const offer = await Offer.findByPk(id);
  if(!offer) return res.status(404).send('Not found');
  // only owner or admin can delete
  if(String(offer.userId) !== String(req.user.id) && req.user.role !== 'admin') return res.status(403).send('Forbidden');
  await offer.destroy();
  res.json({ ok: true });
});

// accept offer
router.post('/:id/accept', auth, async (req, res) => {
  const id = req.params.id;
  const offer = await Offer.findByPk(id);
  if(!offer) return res.status(404).send('Not found');
  // only NGO role can accept
  if(req.user.role !== 'ngo') return res.status(403).send('Only NGOs can accept offers');
  offer.acceptedBy = req.user.id;
  offer.acceptedAt = new Date();
  offer.status = 'accepted';
  await offer.save();
  res.json(offer);
});

module.exports = router;
