const prisma = require('../config/db');

exports.storeContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email and message are required" });
    }

    const contact = await prisma.contactForm.create({
      data: {
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
        name,
        email,
        phone: phone || '',
        subject: subject || '',
        message
      }
    });

    res.json({
      result: "success",
      message: "Contact form submitted successfully",
      contact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.storeSubscriber = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        slug: email.split('@')[0] + '-' + Date.now(),
        email,
        status: 1
      }
    });

    res.json({
      result: "success",
      message: "Subscribed successfully",
      subscriber
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
