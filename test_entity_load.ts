import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkEntity() {
  // Check entity with the ID from logs
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('*')
    .eq('id', 'b5d65cbe-c1f4-453c-b420-de602a0e6789')
    .single();
  
  console.log('=== Entity b5d65cbe-c1f4-453c-b420-de602a0e6789 ===');
  if (entityError) {
    console.log('Error:', entityError);
  } else {
    console.log('Entity:', JSON.stringify(entity, null, 2));
  }
  
  // Check all entities
  const { data: allEntities, error: allError } = await supabase
    .from('entities')
    .select('id, name')
    .order('name');
  
  console.log('\n=== All Entities ===');
  if (allError) {
    console.log('Error:', allError);
  } else {
    console.log(JSON.stringify(allEntities, null, 2));
  }
}

checkEntity();
