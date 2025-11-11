import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCR5kpjb70mHsIEIW9pvYXW7wTRZsoa9e8BV8CY-M4owNIb43xhkOIpIas8U-8tNdM/exec';

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_PASS,
  },
});

app.post('/send-form', async (req, res) => {
  const { nom, prenom, email, message } = req.body || {};
  if (!nom || !email) return res.status(400).json({ ok: false, error: 'nom et email requis' });
  res.json({ ok: true });

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
      `
    });
    console.log('✅ Email envoyé');
  } catch (err) {
    console.error('❌ Erreur e-mail :', err.message);
  }

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, prenom, email, message }),
    });
    console.log('✅ Données envoyées au Google Sheet');
  } catch (err) {
    console.error('❌ Erreur Google Sheet :', err.message);
  }
});

app.get('/', (req, res) => res.send('SmartTrader form API is running ✅'));
app.listen(PORT, () => console.log('🚀 Serveur démarré sur le port ' + PORT));
t changes t changes 
