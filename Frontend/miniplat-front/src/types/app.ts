/**
 * Klientsidige former som ikke finnes i API-et: det som ligger i localStorage, og
 * det redigeringsskjemaene holder på før lagring.
 */
import type { Uuid } from "./api";

/**
 * Alt som faktisk lagres om den innloggede. Token-endepunktet returnerer ingen
 * bruker, så authService faller tilbake på brukernavnet fra skjemaet - resten av
 * profilen hentes separat via UserInfo.
 */
export interface SessionUser {
  username: string;
}

/**
 * En materialrad slik editoren holder den. Nye rader starter uten id og order;
 * begge tildeles først når temaet lagres.
 */
export interface MaterialDraft {
  id?: Uuid;
  description: string;
  link: string;
  order?: number;
}

/**
 * Et nytt tema bygget i nettleseren. Uten order - serveren utleder den fra
 * posisjonen i listen - og uten revisjonsfeltene, som serveren fyller ut.
 */
export interface TopicDraft {
  id: Uuid;
  title: string;
  description: string;
  materials: MaterialDraft[];
  isHidden: boolean;
  isDeleted: boolean;
  lastModifiedAt: string;
}
