import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../api/client.js';

export interface ServerItem {
  id: string;
  hostname: string;
  environment: 'PROD' | 'STAGING' | 'QA' | 'DR';
  status: 'ACTIVE' | 'MAINTENANCE' | 'DECOMMISSIONED';
  ownerTeam: string;
  os: string;
  archivedAt?: string | null;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ServersState {
  items: ServerItem[];
  pagination: PaginationMeta;
  search: string;
  environment: string;
  status: string;
  isLoading: boolean;
  error: string | null;
  selectedServer: ServerItem | null;
}

const initialState: ServersState = {
  items: [],
  pagination: { page: 1, pageSize: 15, total: 0, totalPages: 0 },
  search: '',
  environment: '',
  status: '',
  isLoading: false,
  error: null,
  selectedServer: null,
};

export const fetchServers = createAsyncThunk(
  'servers/fetchServers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { servers: ServersState };
      const { page, pageSize } = state.servers.pagination;
      const { search, environment, status } = state.servers;

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (search.trim()) params.append('search', search.trim());
      if (environment) params.append('environment', environment);
      if (status) params.append('status', status);

      const res = await api.get<{ data: ServerItem[]; pagination: PaginationMeta }>(
        `/servers?${params.toString()}`
      );
      return res.data;
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch servers');
    }
  }
);

export const serversSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.pagination.page = 1;
    },
    setEnvironment(state, action: PayloadAction<string>) {
      state.environment = action.payload;
      state.pagination.page = 1;
    },
    setStatus(state, action: PayloadAction<string>) {
      state.status = action.payload;
      state.pagination.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.pagination.page = action.payload;
    },
    setSelectedServer(state, action: PayloadAction<ServerItem | null>) {
      state.selectedServer = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchServers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearch, setEnvironment, setStatus, setPage, setSelectedServer } =
  serversSlice.actions;
export default serversSlice.reducer;