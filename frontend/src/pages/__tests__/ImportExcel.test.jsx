import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImportExcel from '../ImportExcel';

const { useAuth, usePreviewExcelImport, useCommitExcelImport, preview, commit } = vi.hoisted(() => ({
  useAuth: vi.fn(),
  usePreviewExcelImport: vi.fn(),
  useCommitExcelImport: vi.fn(),
  preview: { mutate: vi.fn(), reset: vi.fn() },
  commit: { mutate: vi.fn(), reset: vi.fn() },
}));

vi.mock('../../context/AuthContext', () => ({ useAuth }));
vi.mock('../../hooks/useImports', () => ({ usePreviewExcelImport, useCommitExcelImport }));

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function xlsxFile(name = 'GESTION DES BOOKING.xlsx', size = 25378) {
  const file = new File(['x'], name, { type: XLSX_TYPE });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function report(overrides = {}) {
  return {
    file: { name: 'GESTION DES BOOKING.xlsx', sheetName: 'BOOKING', headerRow: 15, endRow: 31, ignoredBelow: 48 },
    report: {
      dryRun: true,
      total: 3,
      created: { clients: 1, bookings: 2, tractors: 2, trailers: 1, containers: 2, movements: 1 },
      skipped: 0,
      warnings: ['Clients en double pour "CLIENT ALPHA" (#4, #9) : le plus ancien (#4) est utilisé.'],
      errors: [{ row: 20, message: 'Le conteneur "TCNU00038" existe déjà sur un autre booking (#121) : ligne ignorée.' }],
      rows: [
        { row: 17, status: 'new', container_number: 'TCNU00035', booking_number: 'BK9900001', client: 'CLIENT ALPHA', movement: true, message: null },
        { row: 18, status: 'existing', container_number: 'TCNU00036', booking_number: 'BK9900001', client: 'CLIENT ALPHA', movement: false, message: null },
        { row: 20, status: 'error', container_number: 'TCNU00038', booking_number: 'BK9900003', client: 'CLIENT ALPHA', movement: false, message: 'Le conteneur "TCNU00038" existe déjà sur un autre booking (#121) : ligne ignorée.' },
      ],
      ...overrides,
    },
  };
}

function mockHooks({ previewState = {}, commitState = {} } = {}) {
  usePreviewExcelImport.mockReturnValue({ ...preview, isPending: false, data: undefined, error: null, ...previewState });
  useCommitExcelImport.mockReturnValue({ ...commit, isPending: false, data: undefined, error: null, ...commitState });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ImportExcel />
    </MemoryRouter>
  );
}

async function chooseFile(user, file = xlsxFile()) {
  await user.upload(screen.getByLabelText(/fichier excel/i), file);
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { id: 1, role: 'admin' } });
  mockHooks();
});

describe('ImportExcel — accès', () => {
  it('is reserved to administrators', () => {
    useAuth.mockReturnValue({ user: { id: 2, role: 'operator' } });

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent("L'import Excel est réservé aux administrateurs.");
    expect(screen.queryByLabelText(/fichier excel/i)).not.toBeInTheDocument();
  });
});

describe('ImportExcel — choix du fichier', () => {
  it('disables the analysis until a file is chosen', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Analyser le fichier' })).toBeDisabled();
  });

  it('shows the chosen file and sends it for analysis', async () => {
    const user = userEvent.setup();
    const file = xlsxFile();
    renderPage();

    await chooseFile(user, file);
    expect(screen.getByText('GESTION DES BOOKING.xlsx')).toBeInTheDocument();
    expect(screen.getByText('24,8 Ko')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Analyser le fichier' }));
    expect(preview.mutate).toHaveBeenCalledWith(file);
  });

  it('rejects a file that is not .xlsx before sending it', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPage();

    await chooseFile(user, new File(['a;b'], 'export.csv', { type: 'text/csv' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Seuls les fichiers Excel .xlsx sont acceptés.');
    expect(screen.getByRole('button', { name: 'Analyser le fichier' })).toBeDisabled();
  });

  it('rejects a file larger than 5 Mo before sending it', async () => {
    const user = userEvent.setup();
    renderPage();

    await chooseFile(user, xlsxFile('gros.xlsx', 6 * 1024 * 1024));

    expect(screen.getByRole('alert')).toHaveTextContent('Fichier trop volumineux (5 Mo maximum).');
    expect(screen.getByRole('button', { name: 'Analyser le fichier' })).toBeDisabled();
  });

  it('discards a previous analysis when another file is chosen', async () => {
    const user = userEvent.setup();
    renderPage();

    await chooseFile(user);

    expect(preview.reset).toHaveBeenCalled();
    expect(commit.reset).toHaveBeenCalled();
  });

  it('shows the server error of the analysis', () => {
    mockHooks({ previewState: { error: new Error("Ligne d'en-tête introuvable (colonnes obligatoires : DATE, NTC).") } });

    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent("Ligne d'en-tête introuvable");
  });
});

describe('ImportExcel — aperçu', () => {
  it('summarises what will be created, without having written anything', () => {
    mockHooks({ previewState: { data: report() } });

    renderPage();

    expect(screen.getByRole('heading', { name: 'Aperçu' })).toBeInTheDocument();
    expect(screen.getByText(/aucune donnée n'a encore été enregistrée/i)).toBeInTheDocument();
    const summary = screen.getByRole('list', { name: 'Résumé' });
    expect(within(summary).getByText('Bookings').nextSibling).toHaveTextContent('2');
    expect(within(summary).getByText('Conteneurs').nextSibling).toHaveTextContent('2');
    expect(within(summary).getByText('Mouvements IN').nextSibling).toHaveTextContent('1');
    expect(within(summary).getByText('Clients').nextSibling).toHaveTextContent('1');
    expect(within(summary).getByText('Véhicules').nextSibling).toHaveTextContent('3');
    expect(within(summary).getByText('Erreurs').nextSibling).toHaveTextContent('1');
    expect(screen.getByText(/48 ligne\(s\) sous le tableau/)).toBeInTheDocument();
    expect(screen.getByText(/Clients en double pour "CLIENT ALPHA"/)).toBeInTheDocument();
  });

  it('shows existing clients completed with a phone number, only when there are some', () => {
    mockHooks({ previewState: { data: report({ updated: { clients: 1 } }) } });
    const { unmount } = renderPage();

    expect(within(screen.getByRole('list', { name: 'Résumé' })).getByText('Clients complétés').nextSibling).toHaveTextContent('1');
    unmount();

    mockHooks({ previewState: { data: report({ updated: { clients: 0 } }) } });
    renderPage();
    expect(screen.queryByText('Clients complétés')).not.toBeInTheDocument();
  });

  it('lists each row with its status and error message', () => {
    mockHooks({ previewState: { data: report() } });

    renderPage();

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText('À créer')).toBeInTheDocument();
    expect(within(rows[0]).getByText('Oui')).toBeInTheDocument();
    expect(within(rows[1]).getByText('Déjà présent')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Erreur')).toBeInTheDocument();
    expect(within(rows[2]).getByText(/existe déjà sur un autre booking/)).toBeInTheDocument();
  });

  it('can show only the rows in error', async () => {
    const user = userEvent.setup();
    mockHooks({ previewState: { data: report() } });
    renderPage();

    await user.click(screen.getByRole('checkbox', { name: 'Afficher uniquement les erreurs (1)' }));

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByText('TCNU00038')).toBeInTheDocument();
  });

  it('imports the analysed file on confirmation', async () => {
    const user = userEvent.setup();
    const file = xlsxFile();
    const { rerender } = renderPage();
    await chooseFile(user, file);
    mockHooks({ previewState: { data: report() } });
    rerender(
      <MemoryRouter>
        <ImportExcel />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Importer' }));

    expect(commit.mutate).toHaveBeenCalledWith(file);
  });

  it('disables the import when there is nothing new', () => {
    const nothing = { clients: 0, bookings: 0, tractors: 0, trailers: 0, containers: 0, movements: 0 };
    mockHooks({ previewState: { data: report({ created: nothing }) } });

    renderPage();

    expect(screen.getByRole('button', { name: 'Importer' })).toBeDisabled();
    expect(screen.getByText('Rien de nouveau à importer : tout est déjà en base.')).toBeInTheDocument();
  });
});

describe('ImportExcel — résultat', () => {
  it('drops the previous result when the file is analysed again', async () => {
    const user = userEvent.setup();
    const file = xlsxFile();
    const { rerender } = renderPage();
    await chooseFile(user, file);
    vi.clearAllMocks();
    mockHooks({ previewState: { data: report() }, commitState: { data: report({ dryRun: false }) } });
    rerender(
      <MemoryRouter>
        <ImportExcel />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'Analyser le fichier' }));

    expect(commit.reset).toHaveBeenCalled();
    expect(preview.mutate).toHaveBeenCalledWith(file);
  });

  it('shows what was created and offers to import another file', async () => {
    const user = userEvent.setup();
    mockHooks({
      previewState: { data: report() },
      commitState: { data: report({ dryRun: false }) },
    });
    renderPage();

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Import terminé');
    expect(within(screen.getByRole('list', { name: 'Résumé' })).getByText('Conteneurs').nextSibling).toHaveTextContent('2');
    expect(screen.queryByRole('button', { name: 'Importer' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir les bookings' })).toHaveAttribute('href', '/bookings');

    await user.click(screen.getByRole('button', { name: 'Importer un autre fichier' }));
    expect(preview.reset).toHaveBeenCalled();
    expect(commit.reset).toHaveBeenCalled();
  });
});
