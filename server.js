// server.js
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

// fetch dynamique (comme dans ton ancien code)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// ton Apps Script (le tien)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCR5kpjb70mHsIEIW9pvYXW7wTRZsoa9e8BV8CY-M4owNIb43xhkOIpIas8U-8tNdM/exec';

// ⚠️ sur Render tu dois mettre ces 2 variables dans les Environment vars :
// ZOHO_USER = contact@smarttrader.cfd
// ZOHO_PASS = ton mot de passe d’application Zoho
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 587,
  secure: false,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
  tls: { rejectUnauthorized: false },
  // on évite que ça bloque trop longtemps
  connectionTimeout: 5000,
});

// CORS : on ouvre pour Hostinger + tout
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json());

app.post('/send-form', async (req, res) => {
  const { nom, prenom, email, message } = req.body || {};

  if (!nom || !email) {
    return res.status(400).json({ ok: false, error: 'Champs manquants' });
  }

  // 1️⃣ on répond TOUT DE SUITE au navigateur (important pour ton front)
  res.json({ ok: true });

  // 2️⃣ on tente l’email Zoho en arrière-plan
  if (process.env.ZOHO_USER && process.env.ZOHO_PASS) {
    try {
      await transporter.sendMail({
        from: process.env.ZOHO_USER,
        to: process.env.ZOHO_USER,
        subject: `Nouveau formulaire : ${prenom || ''} ${nom}`,
        html: `
          <p><b>Nom :</b> ${nom}</p>
          <p><b>Prénom :</b> ${prenom || ''}</p>
          <p><b>Email :</b> ${email}</p>
          <p><b>Message :</b><br>${(message || '').replace(/\n/g, '<br>')}</p>
        `
      });
      console.log('✅ Email Zoho envoyé');
    } catch (err) {
      console.error('❌ Erreur envoi e-mail Zoho :', err.message);
    }
  } else {
    console.log('⚠️ Pas de ZOHO_USER/PASS définis sur Render, email non envoyé.');
  }

  // 3️⃣ on envoie aux Google Sheets en arrière-plan
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, message })
    });
    console.log('✅ Données envoyées à Google Sheets');
  } catch (err) {
    console.error('❌ Erreur envoi vers Google Sheets :', err.message);
  }
});

// test
app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur port ${PORT}`);
});




