/**
 * Medical Conditions Data
 * 
 * This file contains structured data for medical conditions related to throat and ear
 * to support the symptom assessment feature. Each condition includes symptoms, 
 * description, treatment options, and prevention methods.
 */

// Throat conditions
const throatConditions = [
    {
        id: 'strep-throat',
        name: 'Strep Throat',
        description: 'A bacterial infection that can make your throat feel sore and scratchy. It is caused by group A Streptococcus bacteria.',
        symptoms: [
            'Sudden throat pain',
            'Pain when swallowing',
            'Red and swollen tonsils',
            'White patches or streaks on tonsils',
            'Tiny red spots on the roof of the mouth',
            'Swollen lymph nodes in the neck',
            'Fever',
            'Headache',
            'Rash',
            'Nausea or vomiting',
            'Body aches'
        ],
        treatmentOptions: [
            'Antibiotics (usually penicillin or amoxicillin)',
            'Over-the-counter pain relievers',
            'Saltwater gargles',
            'Throat lozenges',
            'Rest and fluids'
        ],
        prevention: [
            'Wash hands frequently',
            'Cover mouth when coughing or sneezing',
            'Don\'t share personal items',
            'Replace toothbrush after being sick'
        ],
        isPotentiallySerious: true
    },
    {
        id: 'tonsillitis',
        name: 'Tonsillitis',
        description: 'Inflammation of the tonsils, typically caused by viral infections or streptococcal bacteria.',
        symptoms: [
            'Sore throat',
            'Red, swollen tonsils',
            'White or yellow coating on tonsils',
            'Difficult or painful swallowing',
            'Fever',
            'Bad breath',
            'Tender lymph nodes in the neck',
            'Scratchy or muffled voice',
            'Headache',
            'Stiff neck',
            'Jaw and neck tenderness'
        ],
        treatmentOptions: [
            'Antibiotics (if bacterial)',
            'Pain relievers',
            'Rest',
            'Increased fluid intake',
            'Saltwater gargles',
            'Humidification',
            'Tonsillectomy (in severe recurrent cases)'
        ],
        prevention: [
            'Good hand hygiene',
            'Avoid close contact with infected individuals',
            'Proper dental hygiene',
            'Don\'t share utensils or drinks'
        ],
        isPotentiallySerious: true
    },
    {
        id: 'laryngitis',
        name: 'Laryngitis',
        description: 'Inflammation of the larynx (voice box) that causes voice changes and throat discomfort.',
        symptoms: [
            'Hoarseness or voice loss',
            'Weak voice',
            'Tickling sensation and rawness in throat',
            'Dry throat',
            'Dry cough',
            'Sore throat',
            'Mild fever',
            'Difficulty speaking',
            'Constant urge to clear throat'
        ],
        treatmentOptions: [
            'Voice rest',
            'Stay hydrated',
            'Avoid decongestants',
            'Use a humidifier',
            'Avoid alcohol and caffeine',
            'Don\'t smoke',
            'Avoid whispering (strains voice more)'
        ],
        prevention: [
            'Avoid excessive voice use',
            'Stay hydrated',
            'Avoid smoking',
            'Limit alcohol and caffeine',
            'Prevent upper respiratory infections'
        ],
        isPotentiallySerious: false
    },
    {
        id: 'pharyngitis',
        name: 'Pharyngitis (Viral Sore Throat)',
        description: 'Inflammation of the pharynx, usually caused by viruses like the common cold or flu.',
        symptoms: [
            'Sore throat',
            'Pain when swallowing',
            'Dry, scratchy throat',
            'Redness in the back of the throat',
            'Runny or stuffy nose',
            'Cough',
            'Mild fever',
            'Sneezing',
            'Fatigue',
            'Body aches',
            'Headache'
        ],
        treatmentOptions: [
            'Rest',
            'Fluids',
            'Warm salt water gargles',
            'Over-the-counter pain relievers',
            'Throat lozenges or sprays',
            'Humidifier use'
        ],
        prevention: [
            'Wash hands frequently',
            'Use hand sanitizer',
            'Avoid close contact with sick people',
            'Don\'t share personal items',
            'Cover coughs and sneezes'
        ],
        isPotentiallySerious: false
    },
    {
        id: 'gerd',
        name: 'GERD (Throat Symptoms)',
        description: 'Gastroesophageal reflux disease that can cause stomach acid to flow back into the throat, causing irritation.',
        symptoms: [
            'Persistent sore throat',
            'Hoarseness',
            'Lump in the throat sensation',
            'Need to clear throat frequently',
            'Postnasal drip',
            'Heartburn',
            'Regurgitation',
            'Chronic cough',
            'Difficulty swallowing',
            'Bitter taste in mouth',
            'Excessive throat mucus'
        ],
        treatmentOptions: [
            'Antacids',
            'H2 blockers',
            'Proton pump inhibitors',
            'Avoid trigger foods',
            'Eat smaller meals',
            'Don\'t eat before bedtime',
            'Elevate head during sleep'
        ],
        prevention: [
            'Maintain healthy weight',
            'Avoid tight clothing',
            'Avoid trigger foods (spicy, fatty, citrus)',
            'Eat at least 3 hours before bedtime',
            'Elevate head of bed',
            'Don\'t smoke'
        ],
        isPotentiallySerious: false
    },
    {
        id: 'diphtheria',
        name: 'Diphtheria',
        description: 'A serious bacterial infection that affects the mucous membranes of the throat and nose. Very rare in developed countries with vaccination programs.',
        symptoms: [
            'Sore throat and pain when swallowing',
            'Gray or white coating on throat',
            'Swollen lymph nodes',
            'Difficulty breathing or rapid breathing',
            'Nasal discharge',
            'Fever',
            'General weakness',
            'Blue skin coloration (cyanosis)'
        ],
        treatmentOptions: [
            'Diphtheria antitoxin',
            'Antibiotics',
            'Hospital treatment',
            'Cardiac monitoring',
            'Respiratory support'
        ],
        prevention: [
            'DTaP vaccination',
            'Tdap booster shots',
            'Isolation of infected individuals'
        ],
        isPotentiallySerious: true
    }
];

// Ear conditions
const earConditions = [
    {
        id: 'otitis-media',
        name: 'Otitis Media (Middle Ear Infection)',
        description: 'An infection of the middle ear, the air-filled space behind the eardrum. Common in children but can occur in adults.',
        symptoms: [
            'Ear pain',
            'Difficulty hearing',
            'Drainage of fluid from the ear',
            'Fever',
            'Headache',
            'Loss of appetite',
            'Irritability',
            'Trouble sleeping',
            'Dizziness',
            'Pulling at ears (in children)'
        ],
        treatmentOptions: [
            'Antibiotics (if bacterial)',
            'Pain relievers',
            'Warm compress',
            'Decongestants (in some cases)',
            'Ear drops',
            'Tympanocentesis (in severe cases)'
        ],
        prevention: [
            'Prevent common colds',
            'Breastfeeding for infants',
            'Avoid secondhand smoke',
            'Vaccinations',
            'Good hand hygiene'
        ],
        isPotentiallySerious: true
    },
    {
        id: 'otitis-externa',
        name: 'Otitis Externa (Swimmer\'s Ear)',
        description: 'An infection of the outer ear canal, often caused by water remaining in the ear after swimming.',
        symptoms: [
            'Ear pain (often severe)',
            'Itchiness in ear canal',
            'Redness and swelling',
            'Drainage of clear or pus-like fluid',
            'Decreased hearing',
            'Feeling of fullness in ear',
            'Tender lymph nodes in neck',
            'Fever (in severe cases)',
            'Pain when touching or pulling earlobe'
        ],
        treatmentOptions: [
            'Ear drops with antibiotics',
            'Ear drops with steroids',
            'Pain relievers',
            'Careful cleaning',
            'Keep ear dry'
        ],
        prevention: [
            'Dry ears thoroughly after swimming/bathing',
            'Use earplugs when swimming',
            'Don\'t insert objects into ears',
            'Use alcohol-based ear drops after swimming',
            'Avoid swimming in polluted water'
        ],
        isPotentiallySerious: false
    },
    {
        id: 'ear-barotrauma',
        name: 'Ear Barotrauma',
        description: 'Ear discomfort and possible damage caused by pressure differences between the inside and outside of the eardrum, often during air travel or scuba diving.',
        symptoms: [
            'Ear pain or discomfort',
            'Feeling of fullness in ears',
            'Muffled hearing',
            'Dizziness',
            'Tinnitus (ringing in ears)',
            'Bleeding from ear (in severe cases)',
            'Vertigo',
            'Nausea'
        ],
        treatmentOptions: [
            'Valsalva maneuver (gentle nose blowing while mouth closed and nostrils pinched)',
            'Chewing gum or swallowing during air pressure changes',
            'Decongestants',
            'Pain relievers',
            'Time (usually resolves within hours or days)'
        ],
        prevention: [
            'Yawn and swallow during ascent/descent',
            'Use special earplugs for flying',
            'Stay awake during takeoff and landing',
            'Use decongestants before flying if you have a cold',
            'Don\'t dive with a cold or congestion'
        ],
        isPotentiallySerious: false
    },
    {
        id: 'earwax-blockage',
        name: 'Earwax Blockage',
        description: 'Excessive accumulation of cerumen (earwax) that blocks the ear canal.',
        symptoms: [
            'Earache',
            'Feeling of fullness in ear',
            'Partial hearing loss',
            'Ringing or noises in ear (tinnitus)',
            'Itching in ear canal',
            'Discharge from ear',
            'Odor from ear',
            'Cough (rare)'
        ],
        treatmentOptions: [
            'Ear drops to soften wax',
            'Irrigation (gentle washing)',
            'Manual removal by healthcare provider',
            'Avoid home remedies with objects'
        ],
        prevention: [
            'Don\'t use cotton swabs inside ears',
            'Regular cleaning of outer ear only',
            'Use preventive ear drops if prone to buildup',
            'Professional cleaning if recurrent'
        ],
        isPotentiallySerious: false
    },
    {
        id: 'tinnitus',
        name: 'Tinnitus',
        description: 'The perception of noise or ringing in the ears when no external sound is present. Often a symptom of an underlying condition.',
        symptoms: [
            'Ringing in ears',
            'Buzzing sounds',
            'Roaring sounds',
            'Clicking sounds',
            'Hissing sounds',
            'Humming sounds',
            'Sounds that match heartbeat (pulsatile tinnitus)',
            'High-pitched sound in one ear',
            'Difficulty concentrating',
            'Sleep problems'
        ],
        treatmentOptions: [
            'Address underlying cause',
            'Sound therapy',
            'White noise machines',
            'Hearing aids if hearing loss present',
            'Avoid loud noises',
            'Limit alcohol and caffeine',
            'Stress management'
        ],
        prevention: [
            'Protect ears from loud noises',
            'Turn down volume',
            'Take breaks from noise exposure',
            'Maintain good cardiovascular health',
            'Limit alcohol, caffeine, and nicotine'
        ],
        isPotentiallySerious: false
    },
    {
        id: 'labyrinthitis',
        name: 'Labyrinthitis',
        description: 'An inner ear infection or inflammation that affects the labyrinth, causing balance and hearing problems.',
        symptoms: [
            'Vertigo (spinning sensation)',
            'Loss of balance',
            'Nausea and vomiting',
            'Hearing loss',
            'Tinnitus (ringing in ears)',
            'Difficulty focusing eyes',
            'Headache',
            'Ear pain',
            'Dizziness with movement',
            'Vision changes'
        ],
        treatmentOptions: [
            'Antivirals (if viral cause suspected)',
            'Antibiotics (if bacterial cause confirmed)',
            'Anti-nausea medications',
            'Vestibular suppressants',
            'Vestibular rehabilitation therapy',
            'Rest and hydration'
        ],
        prevention: [
            'Treat respiratory infections promptly',
            'Keep immunizations up to date',
            'Avoid contact with infected individuals',
            'Good hand hygiene',
            'Don\'t smoke'
        ],
        isPotentiallySerious: true
    }
];

/**
 * Get conditions based on analysis type
 * 
 * @param {string} type - Type of analysis ('throat' or 'ear')
 * @returns {Array} Array of condition objects for the specified type
 * @throws {Error} If type is invalid
 */
const getConditionsData = (type) => {
    if (type === 'throat') {
        return throatConditions;
    } else if (type === 'ear') {
        return earConditions;
    } else {
        throw new Error(`Invalid condition type: ${type}. Must be 'throat' or 'ear'.`);
    }
};

module.exports = getConditionsData;