const Category = require('../models/Category');

const CATEGORIES = [
  {
    name: 'Qrup Uşaqları Əyləndirmə',
    roleCode: 'RAM-EYLENCE-2024',
    responsibles: ['Nuray Cavadzadə'],
    color: '#10b981',
    icon: '🎉'
  },
  {
    name: 'Qrup Uşaqları Maarifləndirmə',
    roleCode: 'RAM-MAARIF-2024',
    responsibles: ['Fatimə Əzizova'],
    color: '#3b82f6',
    icon: '📚'
  },
  {
    name: 'Qrup Ailə Başçılarına Mənəvi Dəstək',
    roleCode: 'RAM-MENEVI-2024',
    responsibles: ['Rauf', 'Ramil'],
    color: '#8b5cf6',
    icon: '❤️'
  },
  {
    name: 'Medya',
    roleCode: 'RAM-MEDYA-2024',
    responsibles: ['Elminaz'],
    color: '#f59e0b',
    icon: '📸'
  },
  {
    name: 'Dekorasiya',
    roleCode: 'RAM-DEKO-2024',
    responsibles: ['Nurgün', 'Ləman'],
    color: '#ec4899',
    icon: '🎨'
  },
  {
    name: 'Mətbəx',
    roleCode: 'RAM-METBEX-2024',
    responsibles: ['Hüseyn'],
    color: '#f97316',
    icon: '🍽️'
  },
  {
    name: 'Tədbir Gedişatı',
    roleCode: 'RAM-TDBIR-2024',
    responsibles: ['Aqil', 'Xədicə'],
    color: '#06b6d4',
    icon: '📋'
  }
];

module.exports = async function seeder() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(CATEGORIES);
      console.log('✅ Kateqoriyalar və rol kodları yaradıldı');
      console.log('\n📌 ROL KODLARI:');
      CATEGORIES.forEach(c => {
        console.log(`   ${c.icon} ${c.name}: ${c.roleCode}`);
      });
    }
  } catch (err) {
    console.error('Seeder xətası:', err);
  }
};