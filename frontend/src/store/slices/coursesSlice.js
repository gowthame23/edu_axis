import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI, teacherAPI, studentAPI } from '../../services/api';

// Async thunks
export const fetchCourses = createAsyncThunk(
  'courses/fetchAll',
  async ({ role }, { rejectWithValue }) => {
    try {
      let response;
      if (role === 'admin') {
        response = await adminAPI.getCourses();
      } else if (role === 'teacher') {
        response = await teacherAPI.getCourses();
      } else if (role === 'student') {
        response = await studentAPI.getCourses();
      }
      return response.data.courses || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const createCourse = createAsyncThunk(
  'courses/create',
  async (courseData, { rejectWithValue }) => {
    try {
      const response = await adminAPI.createCourse(courseData);
      return response.data.course;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create course');
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/update',
  async ({ courseId, courseData }, { rejectWithValue }) => {
    try {
      const response = await adminAPI.updateCourse(courseId, courseData);
      return response.data.course;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update course');
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'courses/delete',
  async (courseId, { rejectWithValue }) => {
    try {
      await adminAPI.deleteCourse(courseId);
      return courseId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete course');
    }
  }
);

const initialState = {
  courses: [],
  loading: false,
  error: null,
  selectedCourse: null,
};

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    setSelectedCourse: (state, action) => {
      state.selectedCourse = action.payload;
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch courses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create course
      .addCase(createCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses.push(action.payload);
      })
      .addCase(createCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update course
      .addCase(updateCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourse.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.courses.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.courses[index] = action.payload;
        }
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete course
      .addCase(deleteCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.courses = state.courses.filter(c => c._id !== action.payload);
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setSelectedCourse, clearSelectedCourse, clearError } = coursesSlice.actions;
export default coursesSlice.reducer;
