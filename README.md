# Breakout Igra

Klasična Atari Breakout igra napravljena s vanilla JavaScript i HTML5 Canvas API.

## Linkovi

- **GitHub Repozitorij**: https://github.com/nincur/atari_project
- **Live Demo**: https://nincur.github.io/atari_project

## Tehnologije

- Čisti HTML5, CSS3 i JavaScript
- Canvas API za grafiku
- Web Storage API za spremanje najboljih rezultata
- Nema vanjskih biblioteka ili frameworka

## Kako igrati

1. Otvori `index.html` u web pregledniku
2. Pritisni **SPACE** za početak igre
3. Koristi **strelice lijevo/desno** za pomicanje palice
4. Uništi svih 50 cigli kako bi pobijedio
5. Nemoj dopustiti da loptica padne ispod palice

## Funkcionalnosti

✅ 50 cigli u 5 redova i 10 stupaca
✅ Različite boje cigli po redovima
✅ 3D efekt sjenčanja na svim elementima
✅ Loptica se odbija od palice, cigli i zidova
✅ Praćenje trenutnog i najboljeg rezultata
✅ Spremanje najboljeg rezultata u localStorage
✅ Zvučni efekti za sudare
✅ Start, Game Over i Win ekrani

## Struktura projekta

```
atari_project/
├── index.html      # Glavna HTML datoteka
├── style.css       # Stilovi
├── game.js         # Logika igre
└── README.md       # Dokumentacija
```


## Lokalno pokretanje

### Metoda 1 - Direktno otvaranje
Jednostavno otvori `index.html` datoteku u pregledniku.

### Metoda 2 - Lokalni server
```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx http-server
```

Zatim otvori `http://localhost:8000` u pregledniku.
