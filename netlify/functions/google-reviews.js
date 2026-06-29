/**
 * AutopartsChile — Sprint 3
 * Netlify Function: /api/google-reviews → proxy Google Places API
 *
 * Env vars requeridas en Netlify dashboard > Site configuration > Environment variables:
 *   GOOGLE_PLACES_API_KEY  — tu API key de Google Cloud (Places API habilitada)
 *   GOOGLE_PLACE_ID        — Place ID de tu negocio en Google Maps
 *
 * Para obtener el Place ID:
 *   1. Busca "Desarmaduría Saravia" en Google Maps
 *   2. Abre la ficha del negocio → en la URL verás: ...place/ChIJ.../...
 *   3. Copia el ID (formato: ChIJxxxxxxxxxxxxxxxx)
 *   O usa: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
 *
 * SEGURIDAD: La API key NUNCA aparece en el frontend. Solo en variables de entorno de Netlify.
 */

exports.handler = async function (event, context) {
  // Solo permite GET
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // Si las env vars no están configuradas, devuelve vacío sin error visible
  if (!apiKey || !placeId) {
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ configured: false, reviews: [] }),
    };
  }

  try {
    const url =
      'https://maps.googleapis.com/maps/api/place/details/json' +
      '?place_id=' + encodeURIComponent(placeId) +
      '&fields=rating,user_ratings_total,reviews' +
      '&language=es' +
      '&reviews_sort=most_relevant' +
      '&key=' + apiKey;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Places API status:', data.status, data.error_message || '');
      return {
        statusCode: 502,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Places API error', status: data.status }),
      };
    }

    const result = data.result;
    const reviews = (result.reviews || []).slice(0, 5).map((r) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text || '',
      time: r.relative_time_description,
      photo: r.profile_photo_url || '',
    }));

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
      body: JSON.stringify({
        configured: true,
        rating: result.rating,
        total: result.user_ratings_total,
        reviews,
      }),
    };
  } catch (err) {
    console.error('google-reviews function error:', err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Internal error' }),
    };
  }
};

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://autopartschile.cl',
    'Access-Control-Allow-Methods': 'GET',
  };
}
