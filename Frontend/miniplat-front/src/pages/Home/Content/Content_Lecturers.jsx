import Highlight from "../../../components/Highlight/Highlight";

const Content_Lecturers = () => {
  return (
    <div>
      <h3>Poštovani profesori,</h3>

      <p>
        Dobrodošli na <strong>MiniPlat</strong>, platformu za učenje na daljinu
        namenski razvijenu za potrebe Visoke škole strukovnih studija za
        obrazovanje vaspitača Novi Sad. U nastavku se nalazi kratko uputstvo u
        video i pisanom obliku koje bi trebalo da vam olakša svakodnevno
        korišćenje ove jednostavne aplikacije.
      </p>

      <h2>1 Režimi rada</h2>
      <p>Platforma za nastavu na daljinu funkcioniše u dva režima. </p>
      <p>
        Prvi režim <strong>namenjen je studentima</strong> i omogućava prikaz
        svih predmeta na svim nivoima studija, naravno bez mogućnosti dodavanja,
        ažuriranja ili uklanjanja sadržaja. Ovaj režim dostupan je svim
        korisnicima koji pristupe platformi i ne zahteva prijavu putem
        korisničkog imena i lozinke.
      </p>
      <p>
        Drugi režim <strong>namenjen je nastavnom osoblju</strong> i pruža
        prikaz samo onih predmeta na kojima je nastavnik profesor ili asistent,
        uz mogućnost dodavanja, ažuriranja, sakrivanja i uklanjanja sadržaja.
        Ovaj režim dostupan je samo nastavnicima koji platformi pristupaju putem
        ličnog korisničkog imena i lozinke.
      </p>

      <h2>2 Prijavljivanje</h2>
      <p>
        Jedinstveno korisničko ime i lozinka dobija se putem maila od zvaničnog
        lica ustanove i za sada se ne mogu menjati.
      </p>
      <p>
        Prijavljivanje na platformu vrši se preko stranice za prijavljivanje
        kojom se pristupa preko zelenog dugmeta u gornjem desnom uglu
        aplikacije. Nakon što se u odgovarajuća polja unesu korisničko ime i
        lozinka, prijavljivanje je moguće pritiskom na dugme{" "}
        <Highlight color="#5cb85c">Prijava</Highlight>.
      </p>

      <h2>3 Izbor predmeta</h2>
      <p>
        Nakon prijave sledi povratak na početnu stranicu, ali ovog puta sa
        predmetima ograničenim na one koje nastavnik zaista predaje. Odabirom
        bilo kog predmeta iz spiska moguće je pristupiti njegovom ažuriranju.
      </p>

      <h2>4 Stranica predmeta</h2>
      <p>
        Na vrhu stranice predmeta nalaze se naslov i kartica sa osnovnim
        informacijama o predmetu. Ispod kartice nalazi se odeljak sa nastavnim
        temama.
      </p>
      <p>
        Nastavna tema predstavlja jednu celinu u kojoj nastavnik grupiše
        nastavne materijale. Svaka tema poseduje naslov, opis i listu
        materijala. Sami materijali predstavljaju parove opisa i linkova, a u
        temi ih može ih biti nijedan ili proizvoljno mnogo.
      </p>
      <p>
        Šta tema predstavlja u semantičkom smislu zavisi od samog nastavnika.
        Jedna tema može obuhvatati jedno predavanje sa materijalima koji
        predstavljaju spoljašnje linkove ka PDF dokumentima, videima,{" "}
        <i>Google Forms</i> upitnicima, i sl. Jedna tema može biti i veći komad
        gradiva koji je tema kolokvijuma, a takođe tema može biti i prosto
        obaveštenje o studentskim obavezama (u kom slučaju najverovatnije neće
        sadržati materijale).
      </p>
      <p>
        Bitno je napomenuti da trenutno nije moguće skladištenje materijala
        direktno na platformi. Zarad boljih performansi sistema od nastavnika se
        očekuje unošenje linkova ka materijalima na različitim spoljašnjim
        servisima poput <i>Google Drive</i>-a, <i>YouTube</i>-a, i sl.
      </p>

      <h2>5 Rad sa temama</h2>
      <p>Jedan predmet može imati proizvoljno mnogo tema.</p>

      <h3>5.1 Nova tema</h3>
      <p>
        Nova tema se dodaje klikom na dugme{" "}
        <Highlight color="#5cb85c">Dodaj temu</Highlight>, nakon čega se
        pojavljuje dijalog za unos naslova, opisa i materijala teme. Polja za
        materijale moguće je dodati pritiskom na dugme{" "}
        <Highlight color="#5cb85c">Dodaj materijal</Highlight>, odnosno ukloniti
        ih pritiskom na dugme sa korpom za otpatke.
      </p>
      <p>
        Nakon što su podaci uneseni, tema se dodaje pritiskom na dugme{" "}
        <Highlight color="#5cb85c">Sačuvaj izmene</Highlight>. Takođe, moguće je
        odustati od dodavanje teme pritiskom na dugme{" "}
        <Highlight color="#d9534f">Odustani</Highlight>.
      </p>

      <h3>5.2 Ažuriranje postojećih tema</h3>
      <p>
        Nakon što je tema dodata biće prikazana na stranici predmeta, nakon čega
        je moguće promeniti redosled tema, ali i ažurirati ih, sakriti ili
        obrisati.
      </p>
      <p>
        Promena redosleda tema moguća je pritiskom sivo dugme{" "}
        <Highlight color="#6c757d">↑</Highlight>, odnosno{" "}
        <Highlight color="#6c757d">↓</Highlight>.
      </p>
      <p>
        Ažuriranje teme moguće je pritiskom na plavo dugme{" "}
        <Highlight color="#5bc0de">Ažuriraj</Highlight>, nakon čega se
        pojavljuje dijalog istovetan onom za kreiranje nove teme. Sva dugmad
        imaju istu funkciju kao i pri kreiranju nove teme.
      </p>

      <p>
        Sakrivanje teme moguće je pritiskom na žuto dugme{" "}
        <Highlight color="#f0ad4e">Sakrij</Highlight>. Sakrivena tema ostaje i
        dalje vidljiva nastavniku prilikom pregleda predmeta, ali je anonimni
        korisnici, odnosno studenti, ne vide. Nakon što je tema sakrivena, dugme
        menja izgled i natpis u <Highlight color="#3f4b5a">Prikaži</Highlight>,
        te je tako moguće ponovo otkriti predmet za studente.
      </p>

      <p>
        Brisanje teme funkcioniše na isti način putem crvenog dugmeta{" "}
        <Highlight color="#d9534f">Obriši</Highlight>. Obrisana tema ostaje i
        dalje vidljiva nastavniku prilikom pregleda predmeta, ali je označena za
        brisanje i kroz nekoliko dana biće trajno obrisana. Sve dok nastavnik
        vidi temu moguće je i vratiti je putem sivog dugmeta{" "}
        <Highlight color="#3f4b5a">Vrati</Highlight>. Nakon što je obrisana
        trajno nestaje sa stranice predmeta. Dok je tema označena za brisanje
        ona nije vidljiva studentima.
      </p>

      <h3>5.3 Status teme</h3>
      <p>Na dnu svake teme vidljiv je status teme. Tema može biti:</p>
      <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem" }}>
        <li style={{ marginBottom: "0.75rem" }}>
          <Highlight color="#5cb85c">Aktivna</Highlight>, kada su svi izloženi
          materijali vidljivi svim studentima,
        </li>
        <li style={{ marginBottom: "0.75rem" }}>
          <Highlight color="#f0ad4e">Sakrivena</Highlight>, kada izloženi
          materijali nisu vidljivi studentima, ali tema ostaje sačuvana,
        </li>
        <li style={{ marginBottom: "0.75rem" }}>
          <Highlight color="#ff0000">Obeležena za brisanje</Highlight>, kada
          izloženi materijali nisu vidljivi studentima ali se tema još uvek može
          vratiti; nakon brisanja tema nestaje zauvek, i
        </li>
        <li style={{ marginBottom: "0.75rem" }}>
          <Highlight color="#880000">
            Sakrivena i obeležena za brisanje
          </Highlight>
          , što je naravno kombinacija prethodna dva statusa.
        </li>
      </ul>

      <h2>6 Odjavljivanje</h2>
      <p>
        Nakon prijavljivanja u gornjem desnom uglu vidljivo je korisničko ime
        pod kojim je korisnik trenutno ulogovan. Pritiskom na svetlo sivo dugme{" "}
        <Highlight color="#f0f0f0" textColor="#000">
          Odjavite se
        </Highlight>{" "}
        moguće je završiti rad na platformi i odjaviti se.
      </p>
    </div>
  );
};

export default Content_Lecturers;
