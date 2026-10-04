<?php
// Google reviews proxy (Places API New): keeps the key server-side and caches the response. Google returns max 5 reviews.

const API_KEY   = '';          // prefer the GOOGLE_API_KEY env var, never commit a key
const PLACE_ID  = '';          // e.g. 'ChIJ...'
const CACHE_TTL = 6 * 3600;    // seconds

header('Content-Type: application/json; charset=utf-8');

$key   = getenv('GOOGLE_API_KEY') ?: API_KEY;
$place = getenv('GOOGLE_PLACE_ID') ?: PLACE_ID;
if (!$key || !$place) {
    http_response_code(503);
    echo json_encode(['error' => 'Brak konfiguracji API_KEY / PLACE_ID']);
    exit;
}

$cacheFile = sys_get_temp_dir() . '/combo-reviews-' . md5($place) . '.json';
if (is_file($cacheFile) && time() - filemtime($cacheFile) < CACHE_TTL) {
    readfile($cacheFile);
    exit;
}

$ch = curl_init('https://places.googleapis.com/v1/places/' . rawurlencode($place) . '?languageCode=pl');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => [
        'X-Goog-Api-Key: ' . $key,
        'X-Goog-FieldMask: rating,userRatingCount,googleMapsUri,reviews',
    ],
]);
$raw  = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code !== 200 || !$raw) {
    if (is_file($cacheFile)) { readfile($cacheFile); exit; }   // serve the last good copy
    http_response_code(502);
    echo json_encode(['error' => 'Google API niedostępne', 'status' => $code]);
    exit;
}

$g = json_decode($raw, true);
$out = [
    'rating'  => $g['rating'] ?? null,
    'count'   => $g['userRatingCount'] ?? 0,
    'url'     => $g['googleMapsUri'] ?? null,
    'reviews' => array_map(fn($r) => [
        'author' => $r['authorAttribution']['displayName'] ?? 'Klient Google',
        'photo'  => $r['authorAttribution']['photoUri'] ?? null,
        'rating' => $r['rating'] ?? 0,
        'text'   => $r['text']['text'] ?? ($r['originalText']['text'] ?? ''),
        'time'   => $r['relativePublishTimeDescription'] ?? '',
    ], $g['reviews'] ?? []),
];

$json = json_encode($out, JSON_UNESCAPED_UNICODE);
@file_put_contents($cacheFile, $json);
echo $json;
