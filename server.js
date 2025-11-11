const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

// import dynamique de fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// URL Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCR5kpjb70mHsIEIW9pvYXW7wTRZsoa9e8BV8CY-M4owNIb43xhkOIpIas8U-8tNdM/exec';

// Config CORS
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json());

// Config SMTP Zoho
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
});

// Route principale
app.post('/send-form', async (req, res) => {
  const { nom, prenom, email, message } = req.body;
  console.log('📩 Reçu:', req.body);

  if (!nom || !email) {
    return res.status(400).json({ ok: false, error: 'Champs manquants' });
  }

  // réponse immédiate
  res.json({ ok: true });

  // Envoi email via Zoho
  try {
    await transporter.sendMail({
      from: process.env.ZOHO_USER,
      to: process.env.ZOHO_USER,
      subject: `📨 Nouveau message de ${prenom} ${nom}`,
      html: `
        <p><b>Nom :</b> ${nom}</p>
        <p><b>Prénom :</b> ${prenom}</p>
        <p><b>Email :</b> ${email}</p>
        <p><b>Message :</b><br>${(message || '').replace(/\n/g, '<br>')}</p>
      `,
    });
    console.log('✅ Email Zoho envoyé');
  } catch (err) {
    console.error('❌ Erreur Zoho:', err.message);
  }

  // Envoi vers Google Sheets
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, message }),
    });
    console.log('✅ Données envoyées à Google Sheet');
  } catch (err) {
    console.error('❌ Erreur Google Sheet:', err.message);
  }
});

// test route
app.get('/', (req, res) => {
  res.send('SmartTrader form API est en ligne ✅');
});

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));





