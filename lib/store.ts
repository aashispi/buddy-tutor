import { create } from "zustand";
import { persist } from "zustand/middleware";

type Grade   = "Grade 3" | "Grade 4" | "Grade 5";
type Subject = "Math" | "Science" | "English" | "Social Studies" | "EVS";

interface ImageData { base64: string; mime: string; previewUrl: string; }

interface TutorState {
  grade:      Grade;
  subject:    Subject;
  image:      ImageData | null;
  chapterCtx: string;
  setGrade:      (g: Grade)    => void;
  setSubject:    (s: Subject)  => void;
  setImage:      (i: ImageData)=> void;
  setChapterCtx: (c: string)   => void;
  clearSession:  ()            => void;
}

export const useTutorStore = create<TutorState>()(
  persist(
    (set) => ({
      grade:      "Grade 4",
      subject:    "Science",
      image:      null,
      chapterCtx: "",
      setGrade:      (grade)      => set({ grade }),
      setSubject:    (subject)    => set({ subject }),
      setImage:      (image)      => set({ image }),
      setChapterCtx: (chapterCtx) => set({ chapterCtx }),
      clearSession:  ()           => set({ image: null, chapterCtx: "" }),
    }),
    {
      name: "buddy-tutor",
      // Only persist preferences, not the raw image data
      partialize: (s) => ({ grade: s.grade, subject: s.subject }),
    }
  )
);
