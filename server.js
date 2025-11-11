// server.js
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = process.env.PORT || 3000;

// ton Apps Script (Google Sheet)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCR5kpjb70mHsIEIW9pvYXW7wTRZsoa9e8BV8CY-M4owNIb43xhkOIpIas8U-8tNdM/exec';

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

// transport Zoho
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER, // contact@smarttrader.cfd
    pass: process.env.ZOHO_PASS, // ton mdp app
  },
});

app.post('/send-form', async (req, res) => {
  const { nom, prenom, email, message } = req.body || {};
  console.log('📥 Reçu du front :', req.body);

  if (!nom || !email) {
    return res.status(400).json({ ok: false, error: 'nom et email requis' });
  }

  // on répond vite au navigateur
  res.json({ ok: true });

  // 1) mail Zoho
  try {
    await transporter.sendMail({
      from: process.env.ZOHO_USER,
      to: process.env.ZOHO_USER,
      subject: `Nouveau message de ${nom}`,
      html: `
        <p><b>Nom :</b> ${nom}</p>
        <p><b>Prénom :</b> ${prenom || '(non renseigné)'}</p>
        <p><b>Email :</b> ${email}</p>
        <p><b>Message :</b><br>${(message || '').replace(/\n/g, '<br>')}</p>
      `,
    });
    console.log('✅ Email Zoho envoyé');
  } catch (err) {
    console.error('❌ Erreur envoi Zoho :', err.message);
  }

  // 2) envoi vers Google Sheet
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, message }),
    });
    console.log('✅ Données envoyées au Google Sheet');
  } catch (err) {
    console.error('❌ Erreur envoi Google Sheet :', err.message);
  }
});

app.get('/', (req, res) => {
  res.send('SmartTrader form API is running ✅');
});

app.listen(PORT, () => {
  console.log('🚀 Serveur démarré sur le port ' + PORT);
});
