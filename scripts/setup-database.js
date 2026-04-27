require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupDatabase() {
  try {
    console.log('🔄 Starting demo data insertion...\n');

    // 1. Check if tables exist
    console.log('🔍 Checking if tables exist...');
    const { data: tables, error: tableError } = await supabase
      .from('tour_packages')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ Tables do not exist yet!');
      console.error('Please follow the setup instructions:');
      console.error('1. Open: https://supabase.com/dashboard');
      console.error('2. Select project: hpobmsfwvrewpjqnmhsv');
      console.error('3. Click "SQL Editor"');
      console.error('4. Create a new query and run the SQL from SETUP_INSTRUCTIONS.md');
      console.error('5. Then run this script again\n');
      process.exit(1);
    }

    console.log('✅ Tables found!\n');

    // 2. Insert demo tour packages
    console.log('🎫 Inserting demo tour packages...');
    const tours = [
      {
        name: 'Arunachal Pradesh Heritage Tour',
        description: 'Explore the cultural and historical landmarks of Arunachal Pradesh with expert guides.',
        duration_hours: 8,
        price: 4500,
        max_passengers: 6,
        car_type: 'premium',
        itinerary: 'Capitol Complex → Ziro Valley → Local Markets → Traditional Villages',
        highlights: ['Capitol Complex', 'Ziro Valley', 'Local Temples', 'Tea Gardens'],
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500'
      },
      {
        name: 'Quick City Tour - Itanagar',
        description: 'Fast-paced tour of Itanagar\'s main attractions perfect for airport transfers.',
        duration_hours: 4,
        price: 2000,
        max_passengers: 4,
        car_type: 'economy',
        itinerary: 'Capitol Complex → Museum → Markets → City Landmarks',
        highlights: ['Capitol Complex', 'Museum', 'Shopping Districts', 'Street Food'],
        image_url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=500'
      },
      {
        name: 'Misty Mountains Adventure',
        description: 'Experience the misty hills and scenic routes of Arunachal Pradesh.',
        duration_hours: 12,
        price: 8000,
        max_passengers: 5,
        car_type: 'premium',
        itinerary: 'Guwahati → Kaziranga Highway → Mountain Roads → Sunrise Point',
        highlights: ['Mountain Views', 'Wildlife', 'Photography Stops', 'Local Cuisine'],
        image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500'
      },
      {
        name: 'Full Day Cultural Experience',
        description: 'Immersive experience into local culture and traditions of the northeast.',
        duration_hours: 10,
        price: 5500,
        max_passengers: 8,
        car_type: 'luxury',
        itinerary: 'Traditional Breakfast → Village Tours → Handicraft Markets → Cultural Show',
        highlights: ['Local Culture', 'Handicrafts', 'Traditional Food', 'Cultural Programs'],
        image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500'
      },
      {
        name: 'Full Day Brutal Experience',
        description: 'Immersive experience into non culture and traditions of the northeast.',
        duration_hours: 20,
        price: 2500,
        max_passengers: 2,
        car_type: 'premium',
        itinerary: 'Continental Breakfast → City Tours → Ganja Markets → Hoe Show',
        highlights: ['Local Culture', 'Handicrafts', 'Traditional Food', 'Cultural Programs'],
        image_url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500'
      }
    ];

    const { data: existingTours } = await supabase
      .from('tour_packages')
      .select('id')
      .limit(1);

    if (!existingTours || existingTours.length === 0) {
      const { error: insertError } = await supabase
        .from('tour_packages')
        .insert(tours);

      if (insertError) {
        console.error('❌ Error inserting tours:', insertError.message);
      } else {
        console.log('✅ Demo tours added! (4 tours)\n');
      }
    } else {
      console.log('ℹ️  Tours already exist, skipping insertion\n');
    }

    // 3. Insert demo bookings
    console.log('📝 Inserting demo bookings...');
    const bookings = [
      {
        booking_id: 'BK-2024-001',
        booking_type: 'taxi',
        user_name: 'Amit Kumar',
        user_email: 'amit.kumar@example.com',
        user_phone: '+919876543210',
        pickup_location: 'Lilabari Airport',
        pickup_date: '2024-04-25',
        pickup_time: '08:00',
        passengers: 3,
        car_type: 'premium',
        total_amount: 1500,
        status: 'confirmed',
        payment_status: 'completed'
      },
      {
        booking_id: 'BK-2024-002',
        booking_type: 'tour',
        user_name: 'Priya Singh',
        user_email: 'priya.singh@example.com',
        user_phone: '+918765432109',
        pickup_location: 'Hotel Vivanta, Itanagar',
        pickup_date: '2024-04-26',
        pickup_time: '09:00',
        passengers: 4,
        car_type: 'economy',
        total_amount: 2000,
        status: 'pending',
        payment_status: 'pending'
      },
      {
        booking_id: 'BK-2024-003',
        booking_type: 'taxi',
        user_name: 'Rahul Nath',
        user_email: 'rahul.nath@example.com',
        user_phone: '+917654321098',
        pickup_location: 'Downtown Itanagar',
        pickup_date: '2024-04-27',
        pickup_time: '14:30',
        passengers: 2,
        car_type: 'economy',
        total_amount: 800,
        status: 'completed',
        payment_status: 'completed'
      }
    ];

    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);

    if (!existingBookings || existingBookings.length === 0) {
      const { error: insertError } = await supabase
        .from('bookings')
        .insert(bookings);

      if (insertError) {
        console.error('❌ Error inserting bookings:', insertError.message);
      } else {
        console.log('✅ Demo bookings added! (3 bookings)\n');
      }
    } else {
      console.log('ℹ️  Bookings already exist, skipping insertion\n');
    }

    // 4. Insert demo payments
    console.log('💰 Inserting demo payments...');
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('id')
      .limit(3);

    const { data: existingPayments } = await supabase
      .from('payments')
      .select('id')
      .limit(1);

    if (bookingsData && bookingsData.length > 0 && (!existingPayments || existingPayments.length === 0)) {
      const payments = [
        {
          booking_id: bookingsData[0]?.id,
          razorpay_order_id: 'order_001',
          razorpay_payment_id: 'pay_001',
          amount: 1500,
          payment_method: 'card',
          status: 'completed'
        },
        {
          booking_id: bookingsData[1]?.id,
          razorpay_order_id: 'order_002',
          razorpay_payment_id: 'pay_002',
          amount: 2000,
          payment_method: 'upi',
          status: 'completed'
        },
        {
          booking_id: bookingsData[2]?.id,
          razorpay_order_id: 'order_003',
          razorpay_payment_id: 'pay_003',
          amount: 800,
          payment_method: 'card',
          status: 'completed'
        }
      ];

      const { error: insertError } = await supabase
        .from('payments')
        .insert(payments);

      if (insertError) {
        console.error('❌ Error inserting payments:', insertError.message);
      } else {
        console.log('✅ Demo payments added! (3 payments)\n');
      }
    } else {
      console.log('ℹ️  Payments already exist, skipping insertion\n');
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📊 Data Added:');
    console.log('  ✓ 4 demo tour packages');
    console.log('  ✓ 3 demo bookings');
    console.log('  ✓ 3 demo payments');
    console.log('\n👉 Next steps:');
    console.log('  1. Go to Supabase Dashboard > Table Editor');
    console.log('     https://supabase.com/dashboard');
    console.log('  2. Select project: hpobmsfwvrewpjqnmhsv');
    console.log('  3. Click "Table Editor" in the left sidebar');
    console.log('  4. Verify tables and data are visible');
    console.log('  5. Run "npm run dev" to restart the app');
    console.log('  6. Log in and check "My Bookings" page\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
