import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTraining } from "@/hooks/useTraining";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash, Edit, Plus, BookOpen, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/platform/training")({
  component: TrainingDashboard,
});

function TrainingDashboard() {
  const { courses, stats, isLoadingCourses, createCourse, updateCourse, deleteCourse } = useTraining();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      modulesCount: 5,
      durationMinutes: 30,
      level: "BEGINNER",
      icon: "Icons.book",
      iconColor: "#4CAF50",
      iconBgColor: "#E8F5E9",
    },
  });

  const onSubmit = (data: any) => {
    if (editingCourse) {
      updateCourse.mutate(
        { id: editingCourse.id, ...data },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingCourse(null);
            form.reset();
          },
        }
      );
    } else {
      createCourse.mutate(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          form.reset();
        },
      });
    }
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    form.reset({
      title: course.title,
      description: course.description,
      modulesCount: course.modulesCount,
      durationMinutes: course.durationMinutes,
      level: course.level,
      icon: course.icon,
      iconColor: course.iconColor,
      iconBgColor: course.iconBgColor,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training & Learning</h1>
          <p className="text-muted-foreground mt-2">
            Manage workforce training modules and track completions.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingCourse(null); form.reset(); }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input {...form.register("title")} placeholder="e.g. Safe Lifting Techniques" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <Select onValueChange={(val) => form.setValue("level", val)} defaultValue={form.getValues("level")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEGINNER">Beginner</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea {...form.register("description")} placeholder="Course overview..." required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Modules</label>
                  <Input type="number" {...form.register("modulesCount")} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (Minutes)</label>
                  <Input type="number" {...form.register("durationMinutes")} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon (Material Icon Name)</label>
                  <Input {...form.register("icon")} placeholder="Icons.security" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon Color (Hex)</label>
                  <Input {...form.register("iconColor")} placeholder="#4CAF50" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon Bg Color (Hex)</label>
                  <Input {...form.register("iconBgColor")} placeholder="#E8F5E9" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createCourse.isPending || updateCourse.isPending}>
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Completions (Workforce)</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompletions || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Courses Database</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Completions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCourses ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : courses.filter((c: any) => c.isActive).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No active courses found.</TableCell>
                </TableRow>
              ) : (
                courses
                  .filter((c: any) => c.isActive)
                  .map((course: any) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                          style={{ backgroundColor: course.iconBgColor, color: course.iconColor }}
                        >
                          {/* Placeholder for icon rendering */}
                          <span>✨</span>
                        </div>
                        <div>
                          <p>{course.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{course.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        course.level === 'BEGINNER' ? 'bg-green-100 text-green-700' :
                        course.level === 'INTERMEDIATE' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {course.level}
                      </span>
                    </TableCell>
                    <TableCell>{course.modulesCount}</TableCell>
                    <TableCell>{course.durationMinutes} min</TableCell>
                    <TableCell>{course.completions}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}>
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("Are you sure you want to delete this course?")) {
                          deleteCourse.mutate(course.id);
                        }
                      }}>
                        <Trash className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
