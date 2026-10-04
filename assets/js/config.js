// Site config. Location data lives in index.html (#kontakt) so search engines can read it.
window.COMBO = {
  // Theme editor tab. Set to false in production, then paste the chosen theme into :root.
  themeEditor: true,

  // Reviews: "curated" uses items below, "endpoint" fetches from api/google-reviews.php.
  reviews: {
    mode: "curated",
    sample: true, // shows the "sample reviews" label, set false once real ones are pasted
    placeId: "", // Google Place ID for the "write a review" link
    endpoint: "api/google-reviews.php",
    minRating: 5,
    maxItems: 8,
    items: [
      { author: "Przykładowy klient", rating: 5, time: "2 tygodnie temu", text: "Szybka i konkretna obsługa. Wycena telefonu zajęła dosłownie kilka minut, wszystko jasno wytłumaczone. Polecam." },
      { author: "Przykładowa klientka", rating: 5, time: "miesiąc temu", text: "Zastawiałam złoty łańcuszek. Bez stresu, bez ukrytych opłat, odebrałam go bez problemu po spłacie. Bardzo miła załoga." },
      { author: "Przykładowy klient", rating: 5, time: "miesiąc temu", text: "Kupiłem konsolę w świetnym stanie i w dobrej cenie. Sprzęt sprawdzony przy mnie, do tego gwarancja rozruchowa." },
      { author: "Przykładowy klient", rating: 5, time: "2 miesiące temu", text: "Uczciwa cena za laptopa, porównywałem w kilku miejscach. Plus za godziny otwarcia, można wpaść nawet wieczorem." },
      { author: "Przykładowa klientka", rating: 5, time: "3 miesiące temu", text: "Profesjonalnie i przejrzyście. Wszystko na piśmie, nic nie trzeba było się domyślać. Na pewno wrócę." }
    ]
  }
};
