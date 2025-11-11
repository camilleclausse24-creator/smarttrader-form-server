// server.js
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
// import fetch from 'node-fetch'; // garde-le commenté si tu es en Node 18+

const app = express();
const PORT = process.env.PORT || 3000;

// Ton Google Apps Script Web App
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCR5kpjb70mHsIEIW9pvYXW7wTRZsoa9e8BV8CY-M4owNIb43xhkOIpIas8U-8tNdM/exec';

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

// ✅ Configuration SMTP Zoho Mail (Europe)
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
  tls: { rejectUnauthorized: false }
});

app.post('/send-form', async (req, res) => {
  const { nom, prenom, email, message } = req.body || {};
  console.log('📥 Reçu du front :', req.body);

  if (!nom || !email) {
    return res.status(400).json({ ok: false, error: 'nom et email requis' });
  }

  let mailOk = false;
  let sheetOk = false;
  let mailError = null;
  let sheetError = null;

  // 1️⃣ Envoi du mail via Zoho
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
    mailOk = true;
  } catch (err) {
    console.error('❌ Erreur envoi Zoho :', err.message);
    mailError = err.message;
  }

  // 2️⃣ Enregistrement Google Sheet
  try {
    const resp = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, message }),
    });
    if (!resp.ok) throw new Error('Réponse Google Script non OK');
    console.log('✅ Données envoyées au Google Sheet');
    sheetOk = true;
  } catch (err) {
    console.error('❌ Erreur envoi Google Sheet :', err.message);
    sheetError = err.message;
  }

  // 3️⃣ Réponse au front
  return res.json({
    ok: mailOk && sheetOk,
    mailOk,
    sheetOk,
    error: `mail: ${mailError || 'OK'} | sheet: ${sheetError || 'OK'}`
  });
});

app.get('/', (req, res) => {
  res.send('SmartTrader form API is running ✅');
});

app.listen(PORT, () => {
  console.log('🚀 Serveur démarré sur le port ' + PORT);
});



