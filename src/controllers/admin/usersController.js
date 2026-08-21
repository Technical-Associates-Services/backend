const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone_number: true,
        created_at: true
      },
      orderBy: { id: 'desc' }
    });
    res.json({ result: 'success', users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, name, phone_number } = req.body;
    
    // Check if exists
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone_number: phone_number || null,
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    res.status(201).json({ result: 'success', message: 'User created' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, name, phone_number } = req.body;

    const data = {
      email,
      name,
      phone_number,
      updated_at: new Date()
    };

    if (password && password.trim() !== '') {
      data.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({ result: 'success', message: 'User updated' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't delete self
    if (req.user && (req.user.userId === parseInt(id) || req.user.id === parseInt(id))) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });
    res.json({ result: 'success', message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
