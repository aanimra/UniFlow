
import { useContext } from 'react';
import { StudyContext } from '../context/StudyContextDefinition';

export function useStudy() {
  const context = useContext(StudyContext);

  if (!context) {
    throw new Error(
      'useStudy необхідно використовувати всередині StudyProvider'
    );
  }

  return context;
}
