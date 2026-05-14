-- Reviews Table (supports both tour packages and taxi bookings)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewable_type VARCHAR(50) NOT NULL,   -- 'tour' | 'taxi_booking'
  reviewable_id UUID NOT NULL,
  user_id UUID,                            -- auth.users.id (nullable for safety)
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one review per user per item
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique
  ON public.reviews(user_email, reviewable_type, reviewable_id);

-- For fast lookup by reviewable item
CREATE INDEX IF NOT EXISTS idx_reviews_reviewable
  ON public.reviews(reviewable_type, reviewable_id);

-- For user's review history
CREATE INDEX IF NOT EXISTS idx_reviews_user_email
  ON public.reviews(user_email);




INSERT INTO public.reviews 
  (reviewable_type, reviewable_id, user_email, user_name, rating, title, comment)
VALUES
  -- ID: e4947d55-eb6f-4ac8-8324-10526bf30df9
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user1@test.com', 'John Doe', 5, 'Amazing!', 'The highlights were incredible.'),
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user2@test.com', 'Jane Smith', 4, 'Very good', 'Well organized, though a bit long.'),
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user3@test.com', 'Bob Wilson', 5, 'Perfect', 'Exceeded all my expectations.'),
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user4@test.com', 'Alice Brown', 3, 'Okay', 'The guide was a bit quiet.'),
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user5@test.com', 'Charlie Davis', 4, 'Good value', 'Worth the money for sure.'),
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user6@test.com', 'Diana Prince', 5, 'Stunning', 'The views were out of this world.'),
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user7@test.com', 'Edward Norton', 2, 'Disappointed', 'Too many people in the group.'),

  -- ID: e0e5ea5c-0a2f-4c32-889f-431b5aa67413
  ('tour', 'e0e5ea5c-0a2f-4c32-889f-431b5aa67413', 'user8@test.com', 'Fiona Hill', 5, 'Highly recommend', 'Professional from start to finish.'),
  ('tour', 'e0e5ea5c-0a2f-4c32-889f-431b5aa67413', 'user9@test.com', 'George Miller', 4, 'Great time', 'A very smooth experience.'),
  ('tour', 'e0e5ea5c-0a2f-4c32-889f-431b5aa67413', 'user10@test.com', 'Hannah Abbott', 5, 'Loved it', 'The best tour of our trip.'),
  ('tour', 'e0e5ea5c-0a2f-4c32-889f-431b5aa67413', 'user11@test.com', 'Ian Wright', 4, 'Nice pace', 'Didn''t feel rushed at all.'),
  ('tour', 'e0e5ea5c-0a2f-4c32-889f-431b5aa67413', 'user12@test.com', 'Julia Roberts', 3, 'Decent', 'The lunch provided was just okay.'),
  ('tour', 'e0e5ea5c-0a2f-4c32-889f-431b5aa67413', 'user13@test.com', 'Kevin Hart', 5, 'Funny guide', 'The guide made the whole trip!'),
  ('tour', 'e0e5ea5c-0a2f-4c32-889f-431b5aa67413', 'user14@test.com', 'Laura Palmer', 4, 'Very scenic', 'Bring a camera!'),

  -- ID: df15cd61-1078-4ea1-8b46-167f0a740f96
  ('tour', 'df15cd61-1078-4ea1-8b46-167f0a740f96', 'user15@test.com', 'Mike Tyson', 5, 'Great energy', 'Loved every second of the trek.'),
  ('tour', 'df15cd61-1078-4ea1-8b46-167f0a740f96', 'user16@test.com', 'Nina Simone', 1, 'Bad experience', 'The bus broke down halfway.'),
  ('tour', 'df15cd61-1078-4ea1-8b46-167f0a740f96', 'user17@test.com', 'Oscar Wilde', 4, 'Well written itinerary', 'Everything went as planned.'),
  ('tour', 'df15cd61-1078-4ea1-8b46-167f0a740f96', 'user18@test.com', 'Paul McCartney', 5, 'Magical', 'A truly spiritual experience.'),
  ('tour', 'df15cd61-1078-4ea1-8b46-167f0a740f96', 'user19@test.com', 'Quincy Jones', 4, 'Solid', 'Reliable and friendly service.'),
  ('tour', 'df15cd61-1078-4ea1-8b46-167f0a740f96', 'user20@test.com', 'Rose Tyler', 3, 'Average', 'I''ve had better guides elsewhere.'),
  ('tour', 'df15cd61-1078-4ea1-8b46-167f0a740f96', 'user21@test.com', 'Steve Rogers', 5, 'Educational', 'Learned so much about the history.'),

  -- ID: bfbeeb05-5937-4e5b-a74d-4a4366abc975 (Heavy Traffic ID)
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user22@test.com', 'Tony Stark', 5, 'Technologically advanced', 'The audio equipment was great.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user23@test.com', 'Uma Thurman', 4, 'Cool', 'Kill Bill vibes in the forest.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user24@test.com', 'Victor Von', 2, 'Not for me', 'Too much walking involved.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user25@test.com', 'Wanda Maximoff', 5, 'Visionary', 'The sights were simply magic.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user26@test.com', 'Xavier Rene', 4, 'Good', 'Professional and punctual.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user27@test.com', 'Yolanda Be', 5, 'Awesome', 'We had a blast!'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user28@test.com', 'Zane Gray', 3, 'Fair', 'Pricey for what you get.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user29@test.com', 'Adam West', 5, 'Classic', 'A must-do for any visitor.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user30@test.com', 'Billy Idol', 4, 'Rebel Yell', 'More fun than I thought!'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user31@test.com', 'Cindy Crawford', 5, 'Beautiful', 'Fashionably late but worth it.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user32@test.com', 'Danny DeVito', 5, 'Big fun', 'Tiny details made it great.'),

  -- ID: 37665a5b-9f29-4712-8c9e-23acc9f7f053
  ('tour', '37665a5b-9f29-4712-8c9e-23acc9f7f053', 'user33@test.com', 'Ellen Degeneres', 5, 'Generous', 'The snacks were a great touch.'),
  ('tour', '37665a5b-9f29-4712-8c9e-23acc9f7f053', 'user34@test.com', 'Frank Castle', 2, 'Rough', 'The road was very bumpy.'),
  ('tour', '37665a5b-9f29-4712-8c9e-23acc9f7f053', 'user35@test.com', 'Gina Carano', 4, 'Strong start', 'The morning portion was best.'),
  ('tour', '37665a5b-9f29-4712-8c9e-23acc9f7f053', 'user36@test.com', 'Hank Pym', 5, 'Small details', 'Attention to detail was 10/10.'),
  ('tour', '37665a5b-9f29-4712-8c9e-23acc9f7f053', 'user37@test.com', 'Iris West', 4, 'Fast', 'Moved quickly but covered everything.'),
  ('tour', '37665a5b-9f29-4712-8c9e-23acc9f7f053', 'user38@test.com', 'Jack Sparrow', 5, 'Treasured', 'A pirate''s life for me!'),
  ('tour', '37665a5b-9f29-4712-8c9e-23acc9f7f053', 'user39@test.com', 'Katy Perry', 4, 'Fireworks', 'The finale was spectacular.'),

  -- Mixed redistribution for variety
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user40@test.com', 'Leo Messi', 5, 'Champion', 'Best tour in the city.'),
  ('tour', 'e0e5ea5c-0a2f-4c32-889f-431b5aa67413', 'user41@test.com', 'Natalie Portman', 5, 'Masterpiece', 'So well put together.'),
  ('tour', 'df15cd61-1078-4ea1-8b46-167f0a740f96', 'user42@test.com', 'Oliver Twist', 3, 'More please', 'Felt a bit short.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user43@test.com', 'Peter Parker', 4, 'Super!', 'Great for families.'),
  ('tour', '37665a5b-9f29-4712-8c9e-23acc9f7f053', 'user44@test.com', 'Quentin Tarantino', 4, 'Dialogue', 'The guide had great stories.'),
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user45@test.com', 'Riley Reid', 5, 'Amazing day', 'Couldnt ask for more.'),
  ('tour', 'e0e5ea5c-0a2f-4c32-889f-431b5aa67413', 'user46@test.com', 'Samuel Jackson', 5, 'Great!', 'Everything was exactly as described.'),
  ('tour', 'df15cd61-1078-4ea1-8b46-167f0a740f96', 'user47@test.com', 'Tina Fey', 4, 'Funny', 'Hilarious guide made it.'),
  ('tour', 'bfbeeb05-5937-4e5b-a74d-4a4366abc975', 'user48@test.com', 'Ursula K', 3, 'Average', 'It was okay.'),
  ('tour', '37665a5b-9f29-4712-8c9e-23acc9f7f053', 'user49@test.com', 'Victor Hugo', 5, 'Epic', 'A monumental experience.'),
  ('tour', 'e4947d55-eb6f-4ac8-8324-10526bf30df9', 'user50@test.com', 'Willa Cather', 4, 'Peaceful', 'Very relaxing and informative.');




  INSERT INTO public.reviews 
  (reviewable_type, reviewable_id, user_email, user_name, rating, title, comment)
VALUES
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'traveler.pro@example.com', 'Marcus Aurelius', 5, 
   'Absolute Perfection', 'The attention to detail on this specific package was unlike any other. Worth every penny.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'adventure_seeker@gmail.com', 'Lara Croft', 5, 
   'Thrilling!', 'Exactly the kind of adventure I was looking for. The hidden spots we visited were breathtaking.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'foodie.fan@outlook.com', 'Gordon R.', 4, 
   'Great food, okay pace', 'The catering was surprisingly high quality for a tour. I wish we had 10 more minutes at the second stop.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'family_man@yahoo.com', 'Clark Griswold', 3, 
   'A bit long for kids', 'Beautiful scenery, but my kids got a bit restless toward the end. Better for adults.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'history_buff@edu.com', 'Diana Jones', 5, 
   'Educational Goldmine', 'Our guide was a walking encyclopedia. I learned more in 4 hours than in 4 years of school!'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'photo_wiz@icloud.com', 'Annie L.', 5, 
   'Photographer’s Dream', 'They timed the stops perfectly with the lighting. My Instagram is going to look amazing.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'minimalist@test.com', 'Zen Master', 4, 
   'Simple and Elegant', 'No flashy gimmicks, just pure nature and good vibes.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'nightowl@example.com', 'Luna Lovegood', 2, 
   'Too early start', 'The 6 AM meeting time was brutal. The tour was okay, but I was too tired to enjoy it.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'tech_guy@startup.io', 'Elon M.', 5, 
   'Efficient Logistics', 'Very impressed by the booking system and the punctuality of the transport.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'backpacker@world.net', 'Jack Kerouac', 4, 
   'Authentic Feel', 'Doesn’t feel like a tourist trap. You actually get to see the real culture.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'luxury_life@vip.com', 'Jay Gatsby', 5, 
   'Splendid!', 'Old sport, this was the highlight of my summer. First-class service all the way.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'yoga_mom@blog.com', 'Namaste Sarah', 5, 
   'So Peaceful', 'The quiet moments by the lake were exactly what I needed to recharge.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'budget_traveler@save.com', 'Penny Pincher', 3, 
   'Pricey but okay', 'It was a good tour, but I’ve seen similar ones for 20% less. You pay for the brand.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'retired_n_lovingit@web.com', 'Betty White', 5, 
   'Wonderful Pace', 'The guide was very patient with us and the walking was manageable for seniors.'),
   
  ('tour', '4789bb9c-9ddf-4f07-baa6-f807fc84fa67', 'mystery_guest@incognito.com', 'Agent 47', 4, 
   'Smooth Operation', 'Quiet, professional, and well-executed. No complaints.');



   INSERT INTO public.reviews 
  (reviewable_type, reviewable_id, user_email, user_name, rating, title, comment)
VALUES
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'nature.lover@example.com', 'Forest G.', 5, 
   'Simply Beautiful', 'The natural landscape was the star of the show. Extremely well-paced.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'city.slicker@test.net', 'Miranda Priestly', 2, 
   'Disappointing logistics', 'The tour started 15 minutes late and the air conditioning on the shuttle was weak. That is all.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'happy.camper@gmail.com', 'Bobby Flay', 5, 
   'Delicious and Scenic', 'The local snacks provided were authentic and tasty. A great way to spend an afternoon.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'wander.lust@yahoo.com', 'Sindy Lou', 4, 
   'Great for Solo Travelers', 'I felt very safe and included as a solo traveler. Met some great people!'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'history.hunter@edu.org', 'Ben Gates', 5, 
   'Hidden Gems', 'We visited spots that aren''t in the typical guidebooks. Highly informative.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'vibe.check@insta.com', 'Zoe Krav', 4, 
   'Good Vibe', 'Music on the boat was great, guide was chill. Good times.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'the.critic@newsletter.com', 'Roger E.', 3, 
   'Too Generic', 'It was a standard tour. Nothing bad, but nothing that particularly blew me away.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'tech.tester@beta.io', 'Linus T.', 4, 
   'Seamless booking', 'The digital ticket worked perfectly and the meeting point was easy to find via GPS.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'family.fun@web.com', 'The Incredibles', 5, 
   'Super Adventure!', 'The kids loved the interactive parts of the tour. Very engaging for all ages.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'rainy.day@outlook.com', 'Stormy D.', 3, 
   'Weather ruined it', 'It rained most of the time. The company provided ponchos, but it wasn''t the same experience.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'lux.travel@gold.com', 'Richie Rich', 5, 
   'Top Tier Service', 'The private section of the tour was worth the upgrade. Excellent champagne selection.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'coffee.addict@bean.com', 'Java Joe', 4, 
   'Nice stops', 'Good balance of walking and resting. The coffee stop was a nice touch.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'fast.lane@race.com', 'Dom Toretto', 5, 
   'Fast and Fun', 'We covered a lot of ground in a short amount of time. Professional drivers.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'student.life@uni.edu', 'Will Hunting', 5, 
   'Smart tour', 'Very deep dive into the architecture. Really appreciated the intellectual approach.'),
   
  ('tour', '4b90389f-de94-424e-aa17-cdfc0c542e6b', 'final.user@test.com', 'The Finisher', 4, 
   'Solid ending to our trip', 'Glad we saved this for our last day. A very pleasant experience.');