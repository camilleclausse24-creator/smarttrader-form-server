// server.js
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
// si ton runtime n'a pas fetch natif, décommente ça et ajoute node-fetch dans package.json
// import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// URL de ton Apps Script (Google Sheet)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCR5kpjb70mHsIEIW9pvYXW7wTRZsoa9e8BV8CY-M4owNIb43xhkOIpIas8U-8tNdM/exec';

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

// transport Zoho
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu', // ou 'smtp.zoho.com' selon ton compte
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER, // ex: contact@smarttrader.cfd
    pass: process.env.ZOHO_PASS, // mot de passe d'application
  },
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

  // 1) envoyer l'email Zoho
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

  // 2) envoyer vers Google Sheet
  try {
    const resp = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, message }),
    });

    if (!resp.ok) {
      throw new Error('Réponse Google Script non OK: ' + resp.status);
    }

    console.log('✅ Données envoyées au Google Sheet');
    sheetOk = true;
  } catch (err) {
    console.error('❌ Erreur envoi Google Sheet :', err.message);
    sheetError = err.message;
  }

  // 3) répondre au navigateur AVEC le détail
  if (mailOk && sheetOk) {
    return res.json({ ok: true });
  } else {
    return res.status(200).json({
      ok: false,
      mailOk,
      sheetOk,
      error: `mail: ${mailError || 'OK'} | sheet: ${sheetError || 'OK'}`
    });
  }
});

app.get('/', (req, res) => {
  res.send('SmartTrader form API is running ✅');
});

app.listen(PORT, () => {
  console.log('🚀 Serveur démarré sur le port ' + PORT);
});

