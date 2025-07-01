import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";

type Categories = {
  id: number;
  name: string;
  link: string;
  img: string;
  description: string;
  allowedRoles: string[];
};

type Travels = {
  id: number;
  name: string;
  img: string;
  date: string;
  validated:boolean;
  description: string;
  company:string;
  to:string;
};

type DocumentItem = {
  title: string;
  printable?: string;
  digital?: string;
};

type DocumentCategory = {
  category: string;
  documents: DocumentItem[];
};

type Data = {
  categories: Categories[];
  travels: Travels[];
  documents: DocumentCategory[];
  error: string | null;
};

const initialData: Data = {
  travels: [],
  categories: [],
  documents: [],
  error: null,
};

const DataContext = createContext<Data | undefined>(undefined);

export const DataProvider = ({ children }: PropsWithChildren<object>) => {
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Data | undefined>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/data.json");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const jsonData: Data = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An error occurred"));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DataContext.Provider value={data || initialData}>
      {error && <p className="error">{error.message}</p>}
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};