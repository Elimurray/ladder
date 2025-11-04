const bcrypt = require('bcrypt');
const pool = require('./config/db');
require('dotenv').config();

const users = [
    { name: 'Alan Clarke', phone: '0272548315', grade: 'B', junior: false, levels: true },
    { name: 'Aidan Jones', phone: '0272861691', grade: 'C', junior: false, levels: false },
    { name: 'Andrew Hargreaves', phone: '0276937138', grade: 'B', junior: false, levels: true },
    { name: 'Andries Terblanche', phone: '0210850862', grade: 'A', junior: false, levels: false },
    { name: 'Anish Verma', phone: '0274994126', grade: 'C', junior: false, levels: true },
    { name: 'Aroha Isaac', phone: '0221623711', grade: 'D', junior: false, levels: false },
    { name: 'Bella Perham', phone: '0210770925', grade: 'C', junior: true, levels: true },
    { name: 'Bismark Basson', phone: '0210835673', grade: 'B', junior: false, levels: false },
    { name: 'Bradley West', phone: '0212971301', grade: 'B', junior: false, levels: true },
    { name: 'Brent Stevens', phone: '0274062446', grade: 'A', junior: false, levels: false },
    { name: 'Brian Fong', phone: '0274748458', grade: 'C', junior: false, levels: true },
    { name: 'Callum Beals', phone: '0276438642', grade: 'D', junior: false, levels: false },
    { name: 'Cam Bishop', phone: '02718004857', grade: 'B', junior: false, levels: true },
    { name: 'Charlie Addy', phone: '0223517581', grade: 'C', junior: true, levels: false },
    { name: 'Christine Trappitt', phone: '0274617671', grade: 'D', junior: false, levels: true },
    { name: 'Craig Higgins', phone: '021471561', grade: 'B', junior: false, levels: false },
    { name: 'Dave Rapson', phone: '0276497343', grade: 'A', junior: false, levels: true },
    { name: 'David French', phone: '0274375315', grade: 'C', junior: false, levels: false },
    { name: 'Dries de Jager', phone: '021329015', grade: 'B', junior: false, levels: true },
    { name: 'Duncan Erasmus', phone: '0224444999', grade: 'C', junior: false, levels: false },
    { name: 'Fabian de Jager', phone: '02040736964', grade: 'D', junior: false, levels: true },
    { name: 'Fuad Baloch', phone: '021636280', grade: 'B', junior: false, levels: false },
    { name: 'Gavin Roden', phone: '0211114233', grade: 'A', junior: false, levels: true },
    { name: 'Gerald Roux', phone: '02108744771', grade: 'C', junior: false, levels: false },
    { name: 'Haylee Robbins', phone: '021641856', grade: 'B', junior: true, levels: true },
    { name: 'Hayley Roux', phone: '02102637121', grade: 'C', junior: false, levels: false },
    { name: 'Irene Van Wijk', phone: '0276566825', grade: 'D', junior: false, levels: true },
    { name: 'Jacob Jarvis', phone: '0224143759', grade: 'C', junior: true, levels: false },
    { name: 'Jacqueline Fillmore', phone: '0212303943', grade: 'B', junior: false, levels: true },
    { name: 'James Green', phone: '021963149', grade: 'A', junior: false, levels: false },
    { name: 'James Pennefather', phone: '0273480917', grade: 'C', junior: false, levels: true },
    { name: 'Janine Roberts', phone: '02102547598', grade: 'D', junior: false, levels: false },
    { name: 'Jareth Mohammed', phone: '0272911836', grade: 'B', junior: false, levels: true },
    { name: 'Jordan Stewart', phone: '0210393927', grade: 'C', junior: false, levels: false },
    { name: 'Joseph Crispe', phone: '0272450845', grade: 'B', junior: false, levels: true },
    { name: 'Joshua Brash', phone: '0272360116', grade: 'D', junior: false, levels: false },
    { name: 'Joshua Lovatt', phone: '0275143868', grade: 'C', junior: false, levels: true },
    { name: 'Joshua Robbins', phone: '021812765', grade: 'D', junior: true, levels: false },
    { name: 'Julian vd Walt', phone: '0210437125', grade: 'B', junior: false, levels: true },
    { name: 'Justin Robbins', phone: '021812765', grade: 'C', junior: false, levels: false },
    { name: 'Karl Addy', phone: '0211165422', grade: 'A', junior: false, levels: true },
    { name: 'Kaylee Duckworth', phone: '0211570477', grade: 'B', junior: true, levels: false },
    { name: 'Kees van Lieshout', phone: '0273002474', grade: 'C', junior: false, levels: true },
    { name: 'Kendall Alexander', phone: '02108829080', grade: 'D', junior: false, levels: false },
    { name: 'Kerrie Van Heerden', phone: '0210576329', grade: 'B', junior: false, levels: true },
    { name: 'Kerry Bain', phone: '021599229', grade: 'C', junior: false, levels: false },
    { name: 'Khizar Baloch', phone: '021636280', grade: 'D', junior: false, levels: true },
    { name: 'Kristelle Basson', phone: '02108658022', grade: 'B', junior: false, levels: false },
    { name: 'Kylie Cooper', phone: '0212248179', grade: 'C', junior: false, levels: true },
    { name: 'Layne Shepherd', phone: '0272870256', grade: 'A', junior: false, levels: false },
    { name: 'Leigh Roberts', phone: '021826263', grade: 'B', junior: false, levels: true },
    { name: 'Louis Kotze', phone: '021975235', grade: 'C', junior: false, levels: false },
    { name: 'Luke Halliwell', phone: '0223679319', grade: 'D', junior: false, levels: true },
    { name: 'Luther Terblanche Jr', phone: '0210850862', grade: 'C', junior: true, levels: false },
    { name: 'Luther Terblanche', phone: '0210850862', grade: 'B', junior: false, levels: true },
    { name: 'Marco Van Blerk', phone: '0272024519', grade: 'A', junior: false, levels: false },
    { name: 'Mark Waldin', phone: '0274785021', grade: 'B', junior: false, levels: true },
    { name: 'Melvyn Bremer', phone: '0212248179', grade: 'C', junior: false, levels: false },
    { name: 'Michael Oosthuizen', phone: '021918560', grade: 'D', junior: false, levels: true },
    { name: 'Nakul Gopal', phone: '0223538173', grade: 'B', junior: false, levels: false },
    { name: 'Nelly Duthie', phone: '0212672265', grade: 'C', junior: false, levels: true },
    { name: 'Nick Anderson', phone: '0220339800', grade: 'A', junior: false, levels: false },
    { name: 'Nick Epsom', phone: '021666248', grade: 'B', junior: false, levels: true },
    { name: 'Nick Strange', phone: '0274821324', grade: 'C', junior: false, levels: false },
    { name: 'Nikki Frost', phone: '0211570477', grade: 'D', junior: false, levels: true },
    { name: 'Paul Jenkins', phone: '021654557', grade: 'B', junior: false, levels: false },
    { name: 'Phoebe Christophers', phone: '0212439220', grade: 'C', junior: true, levels: true },
    { name: 'Rebecca Robbins', phone: '021641856', grade: 'B', junior: false, levels: false },
    { name: 'Rajeev Verma', phone: '02102486011', grade: 'A', junior: false, levels: true },
    { name: 'Rhonda Evaroa', phone: '0272848559', grade: 'C', junior: false, levels: false },
    { name: 'Rob Livingstone', phone: '021909235', grade: 'B', junior: false, levels: true },
    { name: 'Rochelle Brash', phone: '0272028058', grade: 'D', junior: false, levels: false },
    { name: 'Sean Duthie', phone: '0273613134', grade: 'C', junior: false, levels: true },
    { name: 'Stephen Louw', phone: '0220141183', grade: 'B', junior: false, levels: false },
    { name: 'Steve Thompson', phone: '021474471', grade: 'A', junior: false, levels: true },
    { name: 'Surprise Player', phone: '0800646688', grade: 'C', junior: false, levels: false },
    { name: 'Tania Alexander', phone: '0274581459', grade: 'B', junior: false, levels: true },
    { name: 'Teila Zandberg', phone: '0210667917', grade: 'D', junior: false, levels: false },
    { name: 'Teo Suffield', phone: '0220494844', grade: 'C', junior: false, levels: true },
    { name: 'Thomas Anderson', phone: '0220339800', grade: 'B', junior: false, levels: false },
    { name: 'Todd Wilson', phone: '021783082', grade: 'A', junior: false, levels: true },
    { name: 'Tony Alexander', phone: '02108408571', grade: 'C', junior: false, levels: false },
    { name: 'Tracey Murray', phone: '021707333', grade: 'B', junior: false, levels: true },
    { name: 'Vanessa Addy', phone: '0223517581', grade: 'D', junior: false, levels: false },
    { name: 'Virginija Werder', phone: '0272900011', grade: 'C', junior: false, levels: true },
    { name: 'Willem Basson', phone: '021944103', grade: 'B', junior: false, levels: false },
    { name: 'Yvonne Edwards', phone: '0212693081', grade: 'A', junior: false, levels: true }
];



async function importUsers() {
    try {
        // Test database connection first
        console.log('🔌 Testing database connection...');
        const testResult = await pool.query('SELECT NOW()');
        console.log('✅ Database connected:', testResult.rows[0].now);

        console.log('🔐 Generating password hash...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password', salt);
        console.log('✅ Password hash generated\n');

        console.log('📝 Starting bulk import...\n');

        let successCount = 0;
        let skipCount = 0;

        for (const user of users) {
            try {
                // Generate email from name (lowercase, replace spaces with dots)
                const email = user.name.toLowerCase()
                    .replace(/\s+/g, '.')
                    .replace(/[^a-z.]/g, '') + '@squash.com';

                const result = await pool.query(
                    `INSERT INTO users 
           (email, full_name, password_hash, phone_number, squash_grade, is_member, is_admin, is_junior, play_for_levels) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
           RETURNING id`,
                    [email, user.name, passwordHash, user.phone, user.grade, true, false, user.junior, user.levels]
                );

                console.log(`✅ Added: ${user.name} (${email})`);
                successCount++;
            } catch (err) {
                if (err.code === '23505') { // Duplicate key error
                    console.log(`⏭️  Skipped: ${user.name} (already exists)`);
                    skipCount++;
                } else {
                    console.error(`❌ Error adding ${user.name}:`);
                    console.error(`   Code: ${err.code}`);
                    console.error(`   Message: ${err.message}`);
                    console.error(`   Detail: ${err.detail || 'N/A'}\n`);
                }
            }
        }

        console.log(`\n✨ Import complete!`);
        console.log(`   Added: ${successCount} users`);
        console.log(`   Skipped: ${skipCount} users (already existed)`);
        console.log(`\n🔑 All passwords are set to: "password"`);
        console.log(`   Users can login with their generated email (e.g., alan.clarke@squash.com)`);

        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('💥 Fatal error:');
        console.error(err);
        process.exit(1);
    }
}

importUsers();