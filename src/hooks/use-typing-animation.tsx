import { useState, useEffect, useCallback } from 'react';

interface UseTypingAnimationProps {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export const useTypingAnimation = ({
  words,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
}: UseTypingAnimationProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isNewWord, setIsNewWord] = useState(true);

  const handleTyping = useCallback(() => {
    const currentWord = words[currentWordIndex];
    
    if (isPaused) {
      return;
    }

    if (!isDeleting) {
      // Typing
      if (currentText.length < currentWord.length) {
        // Reset isNewWord after first character is typed
        if (currentText.length === 1) {
          setIsNewWord(false);
        }
        setCurrentText(currentWord.substring(0, currentText.length + 1));
      } else {
        // Finished typing, pause before deleting
        setIsPaused(true);
        setTimeout(() => {
          setIsPaused(false);
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      // Deleting
      if (currentText.length > 0) {
        setCurrentText(currentWord.substring(0, currentText.length - 1));
      } else {
        // Finished deleting, move to next word
        setIsDeleting(false);
        setIsNewWord(true);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }
    }
  }, [currentText, currentWordIndex, isDeleting, isPaused, words, pauseDuration]);

  useEffect(() => {
    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timer = setTimeout(handleTyping, isPaused ? pauseDuration : speed);
    return () => clearTimeout(timer);
  }, [handleTyping, isDeleting, typingSpeed, deletingSpeed, isPaused, pauseDuration]);

  return { currentText, isDeleting, isPaused, isNewWord };
};
