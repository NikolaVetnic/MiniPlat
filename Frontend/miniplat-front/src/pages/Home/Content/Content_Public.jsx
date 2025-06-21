import Highlight from "../../../components/Highlight/Highlight";
import YouTubeEmbed from "../../../components/YouTubeEmbed/YouTubeEmbed";

const Content_Public = () => {
  return (
    <div>
      <h3>Poštovani studenti,</h3>

      <p>
        Dobrodošli na <strong>MiniPlat</strong>, platformu za učenje na daljinu
        namenski razvijenu za potrebe Visoke škole strukovnih studija za
        obrazovanje vaspitača Novi Sad. U nastavku se nalazi kratko uputstvo u
        video i pisanom obliku koje bi trebalo da vam olakša svakodnevno
        korišćenje ove jednostavne aplikacije.
      </p>

      <YouTubeEmbed
        videoId="lpFrEM2cX7w"
        maxWidth="640px"
        title="eVŠOVNS MiniPlat: Uputstvo za studente"
      />

      <p>
        Platforma je kreirana tako da bude potpuno otvorena i dostupna svim
        studentima bez potrebe za registrovanjem korisnika i prijavom, drugim
        rečima – <Highlight color="#5cb85c">potpuno anonimno</Highlight>.
        Aplikacija je takođe prilagođena korisnicima koji sadržaju pristupaju
        preko mobilnih telefona.
      </p>

      <h2>1 Izbor predmeta</h2>
      <p>
        Sa leve strane ekrana nalazi se meni sa linkovima ka svim predmetima sa
        osnovnih i master strukovnih studija. Predmeti su organizovani po
        semestrima koje je radi lakšeg korišćenja moguće raširiti i skupiti.
      </p>

      <h2>2 Stranica predmeta</h2>
      <p>
        Na vrhu stranice predmeta nalaze se naslov i kartica sa osnovnim
        informacijama o predmetu. Ispod kartice nalazi se odeljak sa nastavnim
        temama.
      </p>
      <p>
        Nastavna tema predstavlja jednu celinu u kojoj nastavnik grupiše
        nastavne materijale. Svaka tema poseduje naslov, opis i listu
        materijala. Sami materijali predstavljaju parove opisa i linkova, a u
        temi ih može ih biti nijedan ili proizvoljno mnogo. Klikom na linkove
        materijala možete pristupiti sadržaju uređenom od strane nastavnika.
      </p>
    </div>
  );
};

export default Content_Public;
