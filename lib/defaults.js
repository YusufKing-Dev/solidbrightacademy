// Default website content. Everything here can be changed by the administrator
// in Admin -> Website content. Values saved in the database override these.

export const DEFAULTS = {
  schoolName: 'Solid Bright Academy',
  motto: 'Education for Bright Future.',
  logo: '/images/logo.png',

  heroTitle: 'A solid foundation for a bright future',
  heroText:
    'Solid Bright Academy is a Pre-Basic, Basic and College school in Upper Gaa Akanbi, Ilorin, Kwara State, helping children grow in confidence, knowledge and character.',
  heroImage: '/images/hero.jpg',

  aboutIntro:
    'Solid Bright Academy began in 2010 as a lesson centre in its founder’s apartment. In January 2011 it became a formal school with 20 children, and it has grown steadily since. Today the school provides education from Pre-Basic through College.',
  aboutImage: '/images/gallery-1.jpg',
  history:
    'Solid Bright Academy, originally established as a lesson centre in 2010, began its journey with a vision to provide children with quality education and a strong foundation for their future. What started as a small learning initiative in the founder\'s personal apartment gradually grew into a school through dedication, commitment and a passion for educating children.\n\nIn January 2011, the lesson centre was transformed into a formal school, starting with 20 children. As the school continued to grow, the need for a more conducive learning environment became evident. By 2012, the school had constructed its first two classrooms and expanded its student population to approximately 40 children.\n\nIn 2014, the school moved to a new building, marking another significant milestone in its development. That same year, construction of the upstairs section of the building commenced, with the decking completed on October 28, 2015.\n\nOn October 6, 2016, the pupils moved into the upstairs classrooms, marking yet another step forward in the school\'s growth and development.\n\nFrom its humble beginnings, Solid Bright Academy has continued to grow with a commitment to nurturing, educating and empowering young minds, laying the foundation for a brighter future.',
  mission:
    'To create a warm, nurturing and stimulating learning environment where children develop confidence and self-esteem, flourish intellectually and creatively, and grow into knowledgeable, imaginative and capable individuals striving to reach their full potential.',
  vision:
    'To empower students and pupils to acquire, demonstrate and uphold the attitudes, values, knowledge and skills that will equip them to become confident, responsible and lifelong learners.',
  coreValues: '',
  anthem:
    'We shall make Solid School\nGreat, Great, Great 3x\nRight now and forever\nSolid School is for you\nSolid School is for the total Child\nSolid Kiddies foundation\nBy the grace of God\nIs aims and pursuit\nA total Child\nSolid School!\nIs pursuit some excellent\nSolid School!!\nIs pursuit some excellent',
  activities:
    "Sports Day\nChildren's Day\nTeachers' Day\nInter-House Sports\nFunny Day\nNo Bag Day\nScience Day\nEgg Day\nFruit Day\nHealth Day\nStudent Skill\nJet Club\nFarmers' Club\nExcursion\nPopcorn Day",

  prebasicText:
    'Our Pre-Basic section (nursery and early childhood education) is where the youngest children take their first steps in school. It begins with KG, in a warm and caring setting that helps each child grow in confidence and curiosity.',
  basicText:
    'Our Basic section (primary education) covers Basic 1 to Basic 5. Pupils build a strong foundation in reading, writing and number work, alongside the clubs, school events and activities that make learning enjoyable.',
  collegeText:
    'Our College section (secondary education) covers JSS 1 to JSS 3 and SS 1 to SS 3. Students are guided to become responsible, knowledgeable and capable young people, ready for the next stage of their education.',

  whyChoose:
    'Over a decade of experience | Solid Bright Academy started as a lesson centre in 2010 and became a formal school in January 2011.\nOne school, three levels | Pre-Basic, Basic and College are all in one school, so children can grow with us from KG to SS 3.\nA warm, nurturing environment | Our mission is a stimulating place where children build confidence and self-esteem.\nMore than classwork | Sports Day, Science Day, Farmers\' Club, Jet Club, excursions and many other school activities.\nA growing school | From two classrooms in 2012 to a two-storey building in the heart of Upper Gaa Akanbi.',

  proprietressName: 'Mrs. Bukola Sadiat Ojo',
  proprietressTitle: 'Proprietress',
  proprietressMessage: '',
  proprietressPhoto: '/images/proprietress.jpg',

  admissionInfo:
    'Parents and guardians can apply online using the form on this page. After you submit it, the school office will review your application and contact you on the phone number or email you provide.',

  hotline: '08035292332',
  otherPhones: '08034620718\n08126285489',
  email: 'solidbrightacademy2011@gmail.com',
  address: 'PA Jonathan Street, Opp. Agbabiaka L.G.A. Primary School, Upper Gaa Akanbi, Ilorin, Kwara State.',
  facebook: '',
  instagram: '',
  whatsapp: '',

  notificationEmail: 'solidbrightacademy2011@gmail.com',
  googleVerification: '',
  gaId: '',

  maxCA: '40',
  maxExam: '60',
};

// What the administrator can edit. group: 'content' or 'system'
export const CONTENT_FIELDS = [
  { key: 'logo', label: 'School logo', type: 'image', group: 'content', help: 'Upload the official logo (PNG with transparent background works best). It is never stretched.' },
  { key: 'motto', label: 'School motto', type: 'text', group: 'content' },
  { key: 'heroTitle', label: 'Homepage headline', type: 'text', group: 'content' },
  { key: 'heroText', label: 'Homepage introduction', type: 'textarea', group: 'content' },
  { key: 'heroImage', label: 'Homepage main image', type: 'image', group: 'content' },
  { key: 'aboutIntro', label: 'About summary (homepage)', type: 'textarea', group: 'content' },
  { key: 'aboutImage', label: 'About section image', type: 'image', group: 'content' },
  { key: 'history', label: 'School history', type: 'textarea', rows: 12, group: 'content', help: 'Leave a blank line between paragraphs.' },
  { key: 'mission', label: 'Mission', type: 'textarea', group: 'content' },
  { key: 'vision', label: 'Vision', type: 'textarea', group: 'content' },
  { key: 'coreValues', label: 'Core values', type: 'textarea', rows: 6, group: 'content', help: 'One value per line. Leave empty to hide this section.' },
  { key: 'anthem', label: 'School anthem', type: 'textarea', rows: 10, group: 'content', help: 'One line per row. Leave empty to hide.' },
  { key: 'activities', label: 'School activities', type: 'textarea', rows: 8, group: 'content', help: 'One activity per line.' },
  { key: 'prebasicText', label: 'Pre-Basic description', type: 'textarea', group: 'content' },
  { key: 'basicText', label: 'Basic description', type: 'textarea', group: 'content' },
  { key: 'collegeText', label: 'College description', type: 'textarea', group: 'content' },
  { key: 'whyChoose', label: 'Why choose us', type: 'textarea', rows: 8, group: 'content', help: 'One point per line, written as: Title | Description' },
  { key: 'proprietressName', label: 'Proprietress name', type: 'text', group: 'content' },
  { key: 'proprietressTitle', label: 'Proprietress title', type: 'text', group: 'content' },
  { key: 'proprietressMessage', label: 'Proprietress message', type: 'textarea', rows: 6, group: 'content', help: 'Optional welcome message shown beside her photo.' },
  { key: 'proprietressPhoto', label: 'Proprietress photo', type: 'image', group: 'content' },
  { key: 'admissionInfo', label: 'Admission information', type: 'textarea', group: 'content' },
  { key: 'hotline', label: 'Hotline', type: 'text', group: 'content' },
  { key: 'otherPhones', label: 'Other phone numbers', type: 'textarea', rows: 3, group: 'content', help: 'One number per line.' },
  { key: 'email', label: 'Public email address', type: 'text', group: 'content' },
  { key: 'address', label: 'School address', type: 'textarea', rows: 3, group: 'content' },
  { key: 'whatsapp', label: 'WhatsApp number (optional)', type: 'text', group: 'content', help: 'Digits only with country code, e.g. 2348035292332.' },
  { key: 'facebook', label: 'Facebook page link (optional)', type: 'text', group: 'content' },
  { key: 'instagram', label: 'Instagram link (optional)', type: 'text', group: 'content' },

  { key: 'notificationEmail', label: 'Email address that receives admission and contact notifications', type: 'text', group: 'content' },
];