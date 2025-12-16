import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CaseFormData {
  title_ar: string;
  title?: string;
  short_description_ar: string;
  short_description?: string;
  description_ar: string;
  description?: string;
  monthly_cost: number;
  months_needed?: number;
  photo_url?: string;
  admin_profile_picture_url?: string;
  description_images?: string[];
  is_published: boolean;
  is_featured?: boolean;
  city?: string;
  area?: string;
  deserve_zakkah: boolean;
  case_care_type?: 'cancelled' | 'sponsorship' | 'one_time_donation';
  // Donation configuration fields
  min_custom_donation?: number;
  show_monthly_donation?: boolean;
  show_custom_donation?: boolean;
  // Parent profile fields
  rent_amount?: number;
  kids_number?: number;
  health_state?: string;
  parent_age?: number;
  work_ability?: string;
  skills?: string;
  education_level?: string;
  profile_notes?: string;
  contact_phone?: string;
}

interface MonthlyNeed {
  category: string;
  amount: number;
  description: string;
  icon: string;
  color: string;
}

interface Kid {
  id?: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  description: string;
  // Kid profile fields
  health_state?: string;
  current_grade?: string;
  school_name?: string;
  education_progress?: Array<{
    year: string;
    grade: string;
    achievements: string;
  }>;
  certificates?: Array<{
    name: string;
    date: string;
    issuer: string;
  }>;
  ongoing_courses?: Array<{
    name: string;
    type: string;
    status: string;
  }>;
}

interface Charity {
  id: string;
  name: string;
  name_ar: string;
}

interface CaseCharity {
  id?: string;
  charity_id: string;
  charity_name: string;
  charity_name_ar: string;
  monthly_amount: number;
}

interface CaseFormProps {
  caseId?: string;
  onSuccess?: () => void;
}

const CaseForm = ({ caseId, onSuccess }: CaseFormProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingCase, setLoadingCase] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDescriptionImage, setUploadingDescriptionImage] = useState(false);
  const [uploadingAdminProfilePicture, setUploadingAdminProfilePicture] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [imageUrlInput, setImageUrlInput] = useState<string>("");
  const [adminProfilePictureUrl, setAdminProfilePictureUrl] = useState<string>("");
  const [adminProfilePictureUrlInput, setAdminProfilePictureUrlInput] = useState<string>("");
  const [descriptionImages, setDescriptionImages] = useState<string[]>([]);
  const [monthlyNeeds, setMonthlyNeeds] = useState<MonthlyNeed[]>([
    { category: "", amount: 0, description: "", icon: "💰", color: "bg-blue-500" }
  ]);
  const [kids, setKids] = useState<Kid[]>([
    { name: "", age: 0, gender: 'male', description: "" }
  ]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [caseCharities, setCaseCharities] = useState<CaseCharity[]>([]);
  const [selectedCharityId, setSelectedCharityId] = useState<string>("");
  const [newCharityName, setNewCharityName] = useState<string>("");
  const [newCharityNameAr, setNewCharityNameAr] = useState<string>("");
  const [newCharityMonthlyAmount, setNewCharityMonthlyAmount] = useState<number>(0);
  const [showNewCharityForm, setShowNewCharityForm] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CaseFormData>();
  const { toast } = useToast();
  const isEditMode = !!caseId;

  // Load charities list
  useEffect(() => {
    loadCharities();
  }, []);

  // Load case data when in edit mode
  useEffect(() => {
    if (isEditMode && caseId) {
      loadCaseData();
    }
  }, [caseId, isEditMode]);

  const loadCharities = async () => {
    try {
      const { data, error } = await supabase
        .from("charities")
        .select("*")
        .order("name_ar", { ascending: true });

      if (error) throw error;
      setCharities(data || []);
    } catch (error) {
      console.error("Error loading charities:", error);
    }
  };

  const loadCaseData = async () => {
    if (!caseId) return;

    setLoadingCase(true);
    try {
      // Load case data
      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("*, admin_profile_picture_url")
        .eq("id", caseId)
        .single();

      if (caseError) throw caseError;

      // Load monthly needs
      const { data: needsData, error: needsError } = await supabase
        .from("monthly_needs")
        .select("*")
        .eq("case_id", caseId);

      if (needsError) throw needsError;

      // Load kids data
      const { data: kidsData, error: kidsError } = await supabase
        .from("case_kids")
        .select("*")
        .eq("case_id", caseId);

      if (kidsError) throw kidsError;

      // Load case charities
      const { data: caseCharitiesData, error: caseCharitiesError } = await supabase
        .from("case_charities")
        .select(`
          *,
          charities (
            id,
            name,
            name_ar
          )
        `)
        .eq("case_id", caseId);

      if (caseCharitiesError) throw caseCharitiesError;

      // Populate form fields
      if (caseData) {
        setValue("title_ar", caseData.title_ar);
        setValue("title", caseData.title || "");
        setValue("short_description_ar", caseData.short_description_ar);
        setValue("short_description", caseData.short_description || "");
        setValue("description_ar", caseData.description_ar);
        setValue("description", caseData.description || "");
        setValue("monthly_cost", caseData.monthly_cost);
        setValue("months_needed", caseData.months_needed);
        setValue("photo_url", caseData.photo_url || "");
        setValue("is_published", caseData.is_published);
        setValue("is_featured", caseData.is_featured || false);
        setValue("city", caseData.city || "");
        setValue("area", caseData.area || "");
        setValue("deserve_zakkah", caseData.deserve_zakkah || false);
        setValue("case_care_type", (caseData.case_care_type as "cancelled" | "one_time_donation" | "sponsorship") || 'sponsorship');

        // Donation configuration fields
        setValue("min_custom_donation", (caseData as any).min_custom_donation ?? 1);
        setValue("show_monthly_donation", (caseData as any).show_monthly_donation ?? true);
        setValue("show_custom_donation", (caseData as any).show_custom_donation ?? true);

        // Parent profile fields
        setValue("rent_amount", caseData.rent_amount || 0);
        setValue("kids_number", caseData.kids_number || 0);
        setValue("health_state", caseData.health_state || "");
        setValue("parent_age", caseData.parent_age || undefined);
        setValue("education_level", caseData.education_level || "");
        setValue("profile_notes", caseData.profile_notes || "");
        setValue("contact_phone", caseData.contact_phone || "");

        // Set current image URL
        setCurrentImageUrl(caseData.photo_url || "");

        // Set admin profile picture URL
        setAdminProfilePictureUrl(caseData.admin_profile_picture_url || "");
        setValue("admin_profile_picture_url", caseData.admin_profile_picture_url || "");

        // Set description images
        const images = caseData.description_images;
        if (Array.isArray(images)) {
          setDescriptionImages(images.filter((img): img is string => typeof img === 'string'));
        } else {
          setDescriptionImages([]);
        }
      }

      // Populate monthly needs
      if (needsData && needsData.length > 0) {
        setMonthlyNeeds(needsData.map(need => ({
          category: need.category,
          amount: need.amount,
          description: need.description || "",
          icon: need.icon || "💰",
          color: need.color || "bg-blue-500"
        })));
      }

      // Populate kids data
      if (kidsData && kidsData.length > 0) {
        setKids(kidsData.map(kid => ({
          id: kid.id,
          name: kid.name,
          age: kid.age,
          gender: kid.gender as 'male' | 'female',
          description: kid.description || "",
          health_state: kid.health_state || "",
          current_grade: kid.current_grade || "",
          school_name: kid.school_name || "",
          education_progress: (kid.education_progress as any) || [],
          certificates: (kid.certificates as any) || [],
          ongoing_courses: (kid.ongoing_courses as any) || []
        })));
      }

      // Populate case charities
      if (caseCharitiesData && caseCharitiesData.length > 0) {
        setCaseCharities(caseCharitiesData.map((cc: any) => ({
          id: cc.id,
          charity_id: cc.charity_id,
          charity_name: cc.charities?.name || "",
          charity_name_ar: cc.charities?.name_ar || "",
          monthly_amount: Number(cc.monthly_amount) || 0
        })));
      }

    } catch (error) {
      console.error("Error loading case data:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل بيانات الحالة",
        variant: "destructive",
      });
    } finally {
      setLoadingCase(false);
    }
  };

  const getDefaultImage = () => {
    return "/images/default-case-image.jpg";
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة صالحة (JPEG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('case-images')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('case-images')
        .getPublicUrl(fileName);

      setCurrentImageUrl(publicUrl);
      setValue('photo_url', publicUrl);

      toast({
        title: "تم رفع الصورة بنجاح",
        description: "تم رفع صورة الحالة بنجاح",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setCurrentImageUrl("");
    setImageUrlInput("");
    setValue('photo_url', "");
  };

  const handleImageFromUrl = () => {
    if (imageUrlInput.trim()) {
      setCurrentImageUrl(imageUrlInput.trim());
      setImageUrlInput("");
    }
  };

  const handleAdminProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة صالحة (JPEG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setUploadingAdminProfilePicture(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `admin_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('case-images')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('case-images')
        .getPublicUrl(fileName);

      setAdminProfilePictureUrl(publicUrl);
      setValue('admin_profile_picture_url', publicUrl);

      toast({
        title: "تم رفع الصورة بنجاح",
        description: "تم رفع صورة الملف الشخصي للإدارة بنجاح",
      });
    } catch (error) {
      console.error("Error uploading admin profile picture:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setUploadingAdminProfilePicture(false);
    }
  };

  const removeAdminProfilePicture = () => {
    setAdminProfilePictureUrl("");
    setAdminProfilePictureUrlInput("");
    setValue('admin_profile_picture_url', "");
  };

  const handleAdminProfilePictureFromUrl = () => {
    if (adminProfilePictureUrlInput.trim()) {
      setAdminProfilePictureUrl(adminProfilePictureUrlInput.trim());
      setValue('admin_profile_picture_url', adminProfilePictureUrlInput.trim());
      setAdminProfilePictureUrlInput("");
    }
  };

  const handleDescriptionImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار صورة صالحة (JPEG, PNG, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "خطأ",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    setUploadingDescriptionImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `desc_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('case-images')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('case-images')
        .getPublicUrl(fileName);

      const newImages = [...descriptionImages, publicUrl];
      setDescriptionImages(newImages);

      toast({
        title: "تم رفع الصورة بنجاح",
        description: "تم إضافة صورة للوصف بنجاح",
      });
    } catch (error) {
      console.error("Error uploading description image:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء رفع الصورة",
        variant: "destructive",
      });
    } finally {
      setUploadingDescriptionImage(false);
    }
  };

  const removeDescriptionImage = (index: number) => {
    const newImages = descriptionImages.filter((_, i) => i !== index);
    setDescriptionImages(newImages);
  };

  const addMonthlyNeed = () => {
    setMonthlyNeeds([...monthlyNeeds, {
      category: "",
      amount: 0,
      description: "",
      icon: "💰",
      color: "bg-blue-500"
    }]);
  };

  const removeMonthlyNeed = (index: number) => {
    if (monthlyNeeds.length > 1) {
      setMonthlyNeeds(monthlyNeeds.filter((_, i) => i !== index));
    }
  };

  const updateMonthlyNeed = (index: number, field: keyof MonthlyNeed, value: string | number) => {
    const updated = [...monthlyNeeds];
    updated[index] = { ...updated[index], [field]: value };
    setMonthlyNeeds(updated);
  };

  const addKid = () => {
    setKids([...kids, {
      name: "",
      age: 0,
      gender: 'male',
      description: "",
      health_state: "",
      current_grade: "",
      school_name: "",
      education_progress: [],
      certificates: [],
      ongoing_courses: []
    }]);
  };

  const removeKid = (index: number) => {
    if (kids.length > 1) {
      setKids(kids.filter((_, i) => i !== index));
    }
  };

  const updateKid = (index: number, field: keyof Kid, value: string | number) => {
    const updated = [...kids];
    updated[index] = { ...updated[index], [field]: value };
    setKids(updated);
  };

  const addCharity = async () => {
    if (!selectedCharityId && !showNewCharityForm) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار جمعية خيرية أو إضافة جمعية جديدة",
        variant: "destructive",
      });
      return;
    }

    if (showNewCharityForm) {
      // Create new charity first
      if (!newCharityNameAr.trim()) {
        toast({
          title: "خطأ",
          description: "اسم الجمعية بالعربية مطلوب",
          variant: "destructive",
        });
        return;
      }

      try {
        const { data: newCharity, error: charityError } = await supabase
          .from("charities")
          .insert({
            name: newCharityName || newCharityNameAr,
            name_ar: newCharityNameAr,
          })
          .select()
          .single();

        if (charityError) throw charityError;

        // Add to charities list
        setCharities([...charities, newCharity]);

        // Add to case charities
        const newCaseCharity: CaseCharity = {
          charity_id: newCharity.id,
          charity_name: newCharity.name,
          charity_name_ar: newCharity.name_ar,
          monthly_amount: newCharityMonthlyAmount || 0,
        };
        setCaseCharities([...caseCharities, newCaseCharity]);

        // Reset form
        setNewCharityName("");
        setNewCharityNameAr("");
        setNewCharityMonthlyAmount(0);
        setShowNewCharityForm(false);

        toast({
          title: "تم بنجاح",
          description: "تم إضافة الجمعية الخيرية بنجاح",
        });
      } catch (error) {
        console.error("Error creating charity:", error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إضافة الجمعية الخيرية",
          variant: "destructive",
        });
      }
    } else {
      // Add existing charity
      if (!selectedCharityId) return;

      const selectedCharity = charities.find(c => c.id === selectedCharityId);
      if (!selectedCharity) return;

      // Check if already added
      if (caseCharities.some(cc => cc.charity_id === selectedCharityId)) {
        toast({
          title: "تنبيه",
          description: "هذه الجمعية الخيرية موجودة بالفعل",
          variant: "destructive",
        });
        return;
      }

      const newCaseCharity: CaseCharity = {
        charity_id: selectedCharity.id,
        charity_name: selectedCharity.name,
        charity_name_ar: selectedCharity.name_ar,
        monthly_amount: 0,
      };
      setCaseCharities([...caseCharities, newCaseCharity]);
      setSelectedCharityId("");
    }
  };

  const removeCharity = (index: number) => {
    const updated = caseCharities.filter((_, i) => i !== index);
    setCaseCharities(updated);
  };

  const updateCharityMonthlyAmount = (index: number, amount: number) => {
    const updated = [...caseCharities];
    updated[index] = { ...updated[index], monthly_amount: amount };
    setCaseCharities(updated);
  };

  const onSubmit = async (data: CaseFormData) => {
    setLoading(true);

    try {
      if (isEditMode && caseId) {
        // Update existing case
        const skillsArray = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

        const { error: caseError } = await supabase
          .from("cases")
          .update({
            title_ar: data.title_ar,
            title: data.title || "",
            short_description_ar: data.short_description_ar,
            short_description: data.short_description || "",
            description_ar: data.description_ar,
            description: data.description || "",
            monthly_cost: data.monthly_cost,
            months_needed: data.case_care_type === 'one_time_donation' ? 1 : data.months_needed,
            photo_url: currentImageUrl || null,
            admin_profile_picture_url: adminProfilePictureUrl || null,
            description_images: descriptionImages,
            is_published: data.is_published,
            is_featured: data.is_featured || false,
            city: data.city || null,
            area: data.area || null,
            deserve_zakkah: data.deserve_zakkah || false,
            case_care_type: data.case_care_type || 'sponsorship',
            // Donation configuration fields
            min_custom_donation: data.min_custom_donation ?? 1,
            show_monthly_donation: data.show_monthly_donation ?? true,
            show_custom_donation: data.show_custom_donation ?? true,
            // Parent profile fields
            rent_amount: data.rent_amount || 0,
            kids_number: data.kids_number || 0,
            health_state: data.health_state || null,
            parent_age: data.parent_age || null,
            work_ability: data.work_ability || null,
            skills: skillsArray.length > 0 ? skillsArray : null,
            education_level: data.education_level || null,
            profile_notes: data.profile_notes || null,
            contact_phone: data.contact_phone || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", caseId);

        if (caseError) throw caseError;

        // Delete existing monthly needs and insert new ones
        const { error: deleteError } = await supabase
          .from("monthly_needs")
          .delete()
          .eq("case_id", caseId);

        if (deleteError) throw deleteError;

        // Insert updated monthly needs
        if (monthlyNeeds.some(need => need.category.trim())) {
          const validNeeds = monthlyNeeds.filter(need => need.category.trim());
          const needsToInsert = validNeeds.map(need => ({
            case_id: caseId,
            category: need.category,
            amount: need.amount,
            description: need.description,
            icon: need.icon,
            color: need.color
          }));

          const { error: needsError } = await supabase
            .from("monthly_needs")
            .insert(needsToInsert);

          if (needsError) throw needsError;
        }

        // Delete existing kids and insert new ones
        const { error: deleteKidsError } = await supabase
          .from("case_kids")
          .delete()
          .eq("case_id", caseId);

        if (deleteKidsError) throw deleteKidsError;

        // Insert updated kids data
        if (kids.some(kid => kid.name.trim())) {
          const validKids = kids.filter(kid => kid.name.trim());
          const kidsToInsert = validKids.map(kid => ({
            case_id: caseId,
            name: kid.name,
            age: kid.age,
            gender: kid.gender,
            description: kid.description,
            health_state: kid.health_state || null,
            current_grade: kid.current_grade || null,
            school_name: kid.school_name || null,
            education_progress: kid.education_progress || [],
            certificates: kid.certificates || [],
            ongoing_courses: kid.ongoing_courses || []
          }));

          const { error: kidsError } = await supabase
            .from("case_kids")
            .insert(kidsToInsert);

          if (kidsError) throw kidsError;
        }

        // Delete existing case charities and insert new ones
        const { error: deleteCharitiesError } = await supabase
          .from("case_charities")
          .delete()
          .eq("case_id", caseId);

        if (deleteCharitiesError) throw deleteCharitiesError;

        // Insert updated case charities
        if (caseCharities.length > 0) {
          const charitiesToInsert = caseCharities.map(cc => ({
            case_id: caseId,
            charity_id: cc.charity_id,
            monthly_amount: cc.monthly_amount || 0
          }));

          const { error: charitiesError } = await supabase
            .from("case_charities")
            .insert(charitiesToInsert);

          if (charitiesError) throw charitiesError;
        }

        toast({
          title: "تم بنجاح",
          description: "تم تحديث الحالة والاحتياجات الشهرية وبيانات الأطفال بنجاح",
        });

        // Call onSuccess callback if provided
        onSuccess?.();

      } else {
        // Create new case
        const skillsArray = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

        const { data: caseData, error: caseError } = await supabase
          .from("cases")
          .insert({
            title_ar: data.title_ar,
            title: data.title || "",
            short_description_ar: data.short_description_ar,
            short_description: data.short_description || "",
            description_ar: data.description_ar,
            description: data.description || "",
            monthly_cost: data.monthly_cost,
            months_needed: data.case_care_type === 'one_time_donation' ? 1 : data.months_needed,
            photo_url: currentImageUrl || null,
            admin_profile_picture_url: adminProfilePictureUrl || null,
            description_images: descriptionImages,
            is_published: data.is_published,
            is_featured: data.is_featured || false,
            city: data.city || null,
            area: data.area || null,
            deserve_zakkah: data.deserve_zakkah || false,
            case_care_type: data.case_care_type || 'sponsorship',
            // Donation configuration fields
            min_custom_donation: data.min_custom_donation ?? 1,
            show_monthly_donation: data.show_monthly_donation ?? true,
            show_custom_donation: data.show_custom_donation ?? true,
            // Parent profile fields
            rent_amount: data.rent_amount || 0,
            kids_number: data.kids_number || 0,
            health_state: data.health_state || null,
            parent_age: data.parent_age || null,
            total_secured_money: 0
          })
          .select()
          .single();

        if (caseError) throw caseError;

        // Insert monthly needs
        if (caseData && monthlyNeeds.some(need => need.category.trim())) {
          const validNeeds = monthlyNeeds.filter(need => need.category.trim());
          const needsToInsert = validNeeds.map(need => ({
            case_id: caseData.id,
            category: need.category,
            amount: need.amount,
            description: need.description,
            icon: need.icon,
            color: need.color
          }));

          const { error: needsError } = await supabase
            .from("monthly_needs")
            .insert(needsToInsert);

          if (needsError) throw needsError;
        }

        // Insert kids data
        if (caseData && kids.some(kid => kid.name.trim())) {
          const validKids = kids.filter(kid => kid.name.trim());
          const kidsToInsert = validKids.map(kid => ({
            case_id: caseData.id,
            name: kid.name,
            age: kid.age,
            gender: kid.gender,
            description: kid.description,
            health_state: kid.health_state || null,
            current_grade: kid.current_grade || null,
            school_name: kid.school_name || null,
            education_progress: kid.education_progress || [],
            certificates: kid.certificates || [],
            ongoing_courses: kid.ongoing_courses || []
          }));

          const { error: kidsError } = await supabase
            .from("case_kids")
            .insert(kidsToInsert);

          if (kidsError) throw kidsError;
        }

        // Insert case charities
        if (caseData && caseCharities.length > 0) {
          const charitiesToInsert = caseCharities.map(cc => ({
            case_id: caseData.id,
            charity_id: cc.charity_id,
            monthly_amount: cc.monthly_amount || 0
          }));

          const { error: charitiesError } = await supabase
            .from("case_charities")
            .insert(charitiesToInsert);

          if (charitiesError) throw charitiesError;
        }

        toast({
          title: "تم بنجاح",
          description: "تم إضافة الحالة والاحتياجات الشهرية وبيانات الأطفال بنجاح",
        });

        // Reset form only for new cases
        reset();
        setCurrentImageUrl("");
        setAdminProfilePictureUrl("");
        setDescriptionImages([]);
        setMonthlyNeeds([{ category: "", amount: 0, description: "", icon: "💰", color: "bg-blue-500" }]);
        setKids([{
          name: "",
          age: 0,
          gender: 'male',
          description: "",
          health_state: "",
          current_grade: "",
          school_name: "",
          education_progress: [],
          certificates: [],
          ongoing_courses: []
        }]);
        setCaseCharities([]);

        // Call onSuccess callback if provided
        onSuccess?.();
      }

    } catch (error) {
      console.error("Error saving case:", error);
      toast({
        title: "خطأ",
        description: isEditMode ? "حدث خطأ أثناء تحديث الحالة" : "حدث خطأ أثناء إضافة الحالة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingCase) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-lg">جار تحميل بيانات الحالة...</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>بيانات الحالة الأساسية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title_ar">العنوان (عربي)</Label>
              <Input
                id="title_ar"
                {...register("title_ar", { required: "العنوان العربي مطلوب" })}
                placeholder="اسم العائلة أو الحالة"
              />
              {errors.title_ar && (
                <p className="text-sm text-destructive">{errors.title_ar.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">العنوان (إنجليزي) - اختياري</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Family name or case title"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="short_description_ar">الوصف المختصر (عربي)</Label>
              <Textarea
                id="short_description_ar"
                {...register("short_description_ar", { required: "الوصف المختصر العربي مطلوب" })}
                placeholder="وصف مختصر للحالة"
                rows={3}
              />
              {errors.short_description_ar && (
                <p className="text-sm text-destructive">{errors.short_description_ar.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">الوصف المختصر (إنجليزي) - اختياري</Label>
              <Textarea
                id="short_description"
                {...register("short_description")}
                placeholder="Brief case description"
                rows={3}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description_ar">الوصف الكامل (عربي)</Label>
              <Textarea
                id="description_ar"
                {...register("description_ar", { required: "الوصف الكامل العربي مطلوب" })}
                placeholder="قصة الحالة والظروف الخاصة"
                rows={5}
              />
              {errors.description_ar && (
                <p className="text-sm text-destructive">{errors.description_ar.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف الكامل (إنجليزي) - اختياري</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Full case story and circumstances"
                rows={5}
              />
            </div>
          </div>

          {/* Description Images Section */}
          <Card>
            <CardHeader>
              <CardTitle>صور إضافية للوصف</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Display existing description images */}
              {descriptionImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {descriptionImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`صورة وصف ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 p-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeDescriptionImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload new description image */}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleDescriptionImageUpload}
                  disabled={uploadingDescriptionImage}
                  className="hidden"
                  id="description-image-upload"
                />
                <Label
                  htmlFor="description-image-upload"
                  className="cursor-pointer"
                >
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingDescriptionImage}
                    asChild
                  >
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {uploadingDescriptionImage ? "جاري الرفع..." : "إضافة صورة للوصف"}
                    </span>
                  </Button>
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className={`grid gap-4 ${watch("case_care_type") === 'one_time_donation' || watch("case_care_type") === 'cancelled' ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            <div className="space-y-2">
              <Label htmlFor="monthly_cost">
                {watch("case_care_type") === 'one_time_donation' ? 'المبلغ المطلوب (جنيه)' : 'التكلفة الشهرية (جنيه)'}
              </Label>
              <Input
                id="monthly_cost"
                type="number"
                {...register("monthly_cost", {
                  required: watch("case_care_type") === 'one_time_donation' ? "المبلغ المطلوب مطلوب" : "التكلفة الشهرية مطلوبة",
                  min: { value: 1, message: "يجب أن يكون المبلغ أكبر من صفر" }
                })}
                placeholder={watch("case_care_type") === 'one_time_donation' ? "10000" : "2700"}
                disabled={watch("case_care_type") === 'cancelled'}
              />
              {errors.monthly_cost && (
                <p className="text-sm text-destructive">{errors.monthly_cost.message}</p>
              )}
              {watch("case_care_type") === 'one_time_donation' && (
                <p className="text-xs text-muted-foreground">المبلغ الإجمالي المطلوب لمساعدة لمرة واحدة</p>
              )}
              {watch("case_care_type") === 'cancelled' && (
                <p className="text-xs text-muted-foreground">الحالة ملغاة - لا يمكن تعديل المبلغ</p>
              )}
            </div>

            {watch("case_care_type") === 'sponsorship' && (
              <div className="space-y-2">
                <Label htmlFor="months_needed">عدد الأشهر المطلوبة</Label>
                <Input
                  id="months_needed"
                  type="number"
                  {...register("months_needed", {
                    required: "عدد الأشهر مطلوب",
                    min: { value: 1, message: "يجب أن يكون عدد الأشهر أكبر من صفر" }
                  })}
                  placeholder="12"
                />
                {errors.months_needed && (
                  <p className="text-sm text-destructive">{errors.months_needed.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>صورة الحالة</Label>
              <div className="space-y-3">
                {currentImageUrl && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={currentImageUrl}
                      alt="صورة الحالة"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 p-1 h-6 w-6"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="case-image-upload"
                    />
                    <Label
                      htmlFor="case-image-upload"
                      className="cursor-pointer"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingImage}
                        asChild
                      >
                        <span className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          {uploadingImage ? "جاري الرفع..." : "رفع صورة"}
                        </span>
                      </Button>
                    </Label>
                  </div>
                  <div className="text-sm text-muted-foreground text-center">أو</div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="url"
                      placeholder="لصق رابط الصورة هنا"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleImageFromUrl}
                      disabled={!imageUrlInput.trim()}
                    >
                      إضافة
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>صورة الملف الشخصي للإدارة (للعرض في لوحة الإدارة فقط)</Label>
              <div className="space-y-3">
                {adminProfilePictureUrl && (
                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                    <img
                      src={adminProfilePictureUrl}
                      alt="صورة الملف الشخصي للإدارة"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 p-1 h-6 w-6"
                      onClick={removeAdminProfilePicture}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAdminProfilePictureUpload}
                      disabled={uploadingAdminProfilePicture}
                      className="hidden"
                      id="admin-profile-picture-upload"
                    />
                    <Label
                      htmlFor="admin-profile-picture-upload"
                      className="cursor-pointer"
                    >
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingAdminProfilePicture}
                        asChild
                      >
                        <span className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          {uploadingAdminProfilePicture ? "جاري الرفع..." : "رفع صورة الملف الشخصي"}
                        </span>
                      </Button>
                    </Label>
                  </div>
                  <div className="text-sm text-muted-foreground text-center">أو</div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="url"
                      placeholder="لصق رابط الصورة هنا"
                      value={adminProfilePictureUrlInput}
                      onChange={(e) => setAdminProfilePictureUrlInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAdminProfilePictureFromUrl}
                      disabled={!adminProfilePictureUrlInput.trim()}
                    >
                      إضافة
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  هذه الصورة ستظهر فقط في لوحة الإدارة ولن تظهر للمستخدمين
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">المحافظة</Label>
              <Select onValueChange={(value) => setValue("city", value)} defaultValue="القاهرة">
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="القاهرة">القاهرة</SelectItem>
                  <SelectItem value="الإسكندرية">الإسكندرية</SelectItem>
                  <SelectItem value="الجيزة">الجيزة</SelectItem>
                  <SelectItem value="الدقهلية">الدقهلية</SelectItem>
                  <SelectItem value="البحيرة">البحيرة</SelectItem>
                  <SelectItem value="المنوفية">المنوفية</SelectItem>
                  <SelectItem value="الغربية">الغربية</SelectItem>
                  <SelectItem value="كفر الشيخ">كفر الشيخ</SelectItem>
                  <SelectItem value="الشرقية">الشرقية</SelectItem>
                  <SelectItem value="القليوبية">القليوبية</SelectItem>
                  <SelectItem value="الإسماعيلية">الإسماعيلية</SelectItem>
                  <SelectItem value="بورسعيد">بورسعيد</SelectItem>
                  <SelectItem value="السويس">السويس</SelectItem>
                  <SelectItem value="شمال سيناء">شمال سيناء</SelectItem>
                  <SelectItem value="جنوب سيناء">جنوب سيناء</SelectItem>
                  <SelectItem value="الفيوم">الفيوم</SelectItem>
                  <SelectItem value="بني سويف">بني سويف</SelectItem>
                  <SelectItem value="المنيا">المنيا</SelectItem>
                  <SelectItem value="أسيوط">أسيوط</SelectItem>
                  <SelectItem value="سوهاج">سوهاج</SelectItem>
                  <SelectItem value="قنا">قنا</SelectItem>
                  <SelectItem value="الأقصر">الأقصر</SelectItem>
                  <SelectItem value="أسوان">أسوان</SelectItem>
                  <SelectItem value="البحر الأحمر">البحر الأحمر</SelectItem>
                  <SelectItem value="الوادي الجديد">الوادي الجديد</SelectItem>
                  <SelectItem value="مطروح">مطروح</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">المنطقة</Label>
              <Input
                id="area"
                {...register("area")}
                placeholder="حدد المنطقة أو الحي"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deserve_zakkah" className="flex items-center gap-2">
                مستحق للزكاة
              </Label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="deserve_zakkah"
                  checked={watch("deserve_zakkah")}
                  onCheckedChange={(checked) => setValue("deserve_zakkah", checked)}
                />
                <Label htmlFor="deserve_zakkah" className="text-sm text-muted-foreground">
                  الحالة مستحقة للزكاة
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="case_care_type">نوع رعاية الحالة</Label>
              <Select
                value={watch("case_care_type") || 'sponsorship'}
                onValueChange={(value) => setValue("case_care_type", value as 'cancelled' | 'sponsorship' | 'one_time_donation')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع رعاية الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sponsorship">كفالة (التزام شهري)</SelectItem>
                  <SelectItem value="one_time_donation">مساعدة لمرة واحدة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {watch("case_care_type") === 'sponsorship'
                  ? "هذه الحالة تتطلب التزام شهري مستمر"
                  : watch("case_care_type") === 'one_time_donation'
                    ? "هذه الحالة تحتاج مساعدة لمرة واحدة فقط"
                    : "هذه الحالة ملغاة ولا تقبل تبرعات"}
              </p>
            </div>
          </div>

          {/* Donation Configuration Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>إعدادات التبرعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_custom_donation">الحد الأدنى للتبرع المخصص (جنيه)</Label>
                  <Input
                    id="min_custom_donation"
                    type="number"
                    {...register("min_custom_donation")}
                    defaultValue={1}
                    min={1}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    أقل مبلغ يمكن للمتبرع دفعه في التبرع المخصص
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="show_monthly_donation">عرض خيار الكفالة الشهرية</Label>
                  <div className="flex items-center space-x-2 space-x-reverse pt-2">
                    <Switch
                      id="show_monthly_donation"
                      checked={watch("show_monthly_donation") ?? true}
                      onCheckedChange={(checked) => setValue("show_monthly_donation", checked)}
                    />
                    <Label htmlFor="show_monthly_donation" className="text-sm text-muted-foreground">
                      {watch("show_monthly_donation") !== false ? "مفعّل" : "معطّل"}
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="show_custom_donation">عرض خيار التبرع المخصص</Label>
                  <div className="flex items-center space-x-2 space-x-reverse pt-2">
                    <Switch
                      id="show_custom_donation"
                      checked={watch("show_custom_donation") ?? true}
                      onCheckedChange={(checked) => setValue("show_custom_donation", checked)}
                    />
                    <Label htmlFor="show_custom_donation" className="text-sm text-muted-foreground">
                      {watch("show_custom_donation") !== false ? "مفعّل" : "معطّل"}
                    </Label>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ملاحظة: يجب تفعيل خيار واحد على الأقل (الكفالة الشهرية أو التبرع المخصص)
              </p>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="is_published"
                checked={watch("is_published")}
                onCheckedChange={(checked) => setValue("is_published", checked)}
              />
              <Label htmlFor="is_published">نشر الحالة فوراً</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="is_featured"
                checked={watch("is_featured")}
                onCheckedChange={(checked) => setValue("is_featured", checked)}
              />
              <Label htmlFor="is_featured" className="text-sm">
                عرض في القسم المميز (الصفحة الرئيسية)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground pr-6">
              عند تفعيل هذا الخيار، ستظهر الحالة في قسم الحالات المميزة على الصفحة الرئيسية (حد أقصى 3 حالات)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            الاحتياجات الشهرية
            <Button type="button" onClick={addMonthlyNeed} size="sm">
              <Plus className="w-4 h-4 ml-1" />
              إضافة احتياج
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {monthlyNeeds.map((need, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">احتياج {index + 1}</h4>
                {monthlyNeeds.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMonthlyNeed(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>الفئة</Label>
                  <Select onValueChange={(value) => updateMonthlyNeed(index, "category", value)} value={need.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="الطعام والمواد الغذائية">الطعام والمواد الغذائية</SelectItem>
                      <SelectItem value="الإيجار والسكن">الإيجار والسكن</SelectItem>
                      <SelectItem value="المرافق والكهرباء">المرافق والكهرباء</SelectItem>
                      <SelectItem value="العلاج والأدوية">العلاج والأدوية</SelectItem>
                      <SelectItem value="التعليم والدراسة">التعليم والدراسة</SelectItem>
                      <SelectItem value="المواصلات">المواصلات</SelectItem>
                      <SelectItem value="الملابس">الملابس</SelectItem>
                      <SelectItem value="احتياجات الأطفال">احتياجات الأطفال</SelectItem>
                      <SelectItem value="احتياجات كبار السن">احتياجات كبار السن</SelectItem>
                      <SelectItem value="أخرى">أخرى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>المبلغ (جنيه)</Label>
                  <Input
                    type="number"
                    value={need.amount}
                    onChange={(e) => updateMonthlyNeed(index, "amount", Number(e.target.value))}
                    placeholder="1200"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الرمز التعبيري</Label>
                  <Input
                    value={need.icon}
                    onChange={(e) => updateMonthlyNeed(index, "icon", e.target.value)}
                    placeholder="🍽️"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    value={need.description}
                    onChange={(e) => updateMonthlyNeed(index, "description", e.target.value)}
                    placeholder="مواد غذائية أساسية شهرية للعائلة"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>لون التصنيف</Label>
                  <select
                    value={need.color}
                    onChange={(e) => updateMonthlyNeed(index, "color", e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="bg-orange-500">برتقالي</option>
                    <option value="bg-blue-500">أزرق</option>
                    <option value="bg-green-500">أخضر</option>
                    <option value="bg-red-500">أحمر</option>
                    <option value="bg-purple-500">بنفسجي</option>
                    <option value="bg-yellow-500">أصفر</option>
                    <option value="bg-pink-500">وردي</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Parent Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>بيانات ولي الأمر / مقدم الرعاية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_phone">رقم جوال الأم (للدخول)</Label>
            <Input
              id="contact_phone"
              {...register("contact_phone")}
              placeholder="05XXXXXXXX"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">
              هذا الرقم يستخدم لدخول الأم إلى صفحة الاستبيان (mom-survey)
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent_age">العمر</Label>
              <Input
                id="parent_age"
                type="number"
                {...register("parent_age")}
                placeholder="45"
                min="18"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rent_amount">الإيجار الشهري (جنيه)</Label>
              <Input
                id="rent_amount"
                type="number"
                {...register("rent_amount")}
                placeholder="1500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kids_number">عدد الأطفال</Label>
              <Input
                id="kids_number"
                type="number"
                {...register("kids_number")}
                placeholder="3"
                min="0"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="health_state">الحالة الصحية</Label>
              <Textarea
                id="health_state"
                {...register("health_state")}
                placeholder="وصف الحالة الصحية (إن وجدت مشاكل صحية)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_ability">القدرة على العمل</Label>
              <Select onValueChange={(value) => setValue("work_ability", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر القدرة على العمل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="غير قادر">غير قادر على العمل</SelectItem>
                  <SelectItem value="قدرة محدودة">قدرة محدودة على العمل</SelectItem>
                  <SelectItem value="قادر">قادر على العمل</SelectItem>
                  <SelectItem value="يعمل">يعمل حالياً</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="education_level">المستوى التعليمي</Label>
              <Select onValueChange={(value) => setValue("education_level", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستوى التعليمي" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="أمي">أمي (لا يقرأ ولا يكتب)</SelectItem>
                  <SelectItem value="يقرأ ويكتب">يقرأ ويكتب</SelectItem>
                  <SelectItem value="ابتدائية">ابتدائية</SelectItem>
                  <SelectItem value="إعدادية">إعدادية</SelectItem>
                  <SelectItem value="ثانوية">ثانوية أو مؤهل متوسط</SelectItem>
                  <SelectItem value="جامعي">جامعي</SelectItem>
                  <SelectItem value="دراسات عليا">دراسات عليا</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">المهارات (مفصولة بفاصلة)</Label>
              <Input
                id="skills"
                {...register("skills")}
                placeholder="خياطة, طبخ, نجارة"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_notes">ملاحظات إضافية</Label>
            <Textarea
              id="profile_notes"
              {...register("profile_notes")}
              placeholder="أي معلومات إضافية مهمة عن الأسرة أو الظروف الخاصة"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            بيانات الأطفال
            <Button type="button" onClick={addKid} size="sm">
              <Plus className="w-4 h-4 ml-1" />
              إضافة طفل
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {kids.map((kid, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">طفل {index + 1}</h4>
                {kids.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeKid(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>اسم الطفل</Label>
                  <Input
                    value={kid.name}
                    onChange={(e) => updateKid(index, "name", e.target.value)}
                    placeholder="أحمد محمد"
                  />
                </div>

                <div className="space-y-2">
                  <Label>العمر</Label>
                  <Input
                    type="number"
                    value={kid.age}
                    onChange={(e) => updateKid(index, "age", Number(e.target.value))}
                    placeholder="8"
                    min="0"
                    max="18"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الجنس</Label>
                  <Select onValueChange={(value) => updateKid(index, "gender", value)} value={kid.gender}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الجنس" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر</SelectItem>
                      <SelectItem value="female">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>الحالة الصحية</Label>
                  <Input
                    value={kid.health_state || ""}
                    onChange={(e) => updateKid(index, "health_state", e.target.value)}
                    placeholder="جيدة / لديه مشاكل صحية"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الصف الدراسي</Label>
                  <Input
                    value={kid.current_grade || ""}
                    onChange={(e) => updateKid(index, "current_grade", e.target.value)}
                    placeholder="الصف الثالث الابتدائي"
                  />
                </div>

                <div className="space-y-2">
                  <Label>اسم المدرسة</Label>
                  <Input
                    value={kid.school_name || ""}
                    onChange={(e) => updateKid(index, "school_name", e.target.value)}
                    placeholder="مدرسة النصر الابتدائية"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>وصف إضافي</Label>
                <Textarea
                  value={kid.description}
                  onChange={(e) => updateKid(index, "description", e.target.value)}
                  placeholder="معلومات إضافية عن الطفل (اهتمامات، مواهب، احتياجات خاصة)"
                  rows={2}
                />
              </div>

              <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                <p className="font-medium mb-1">📚 تتبع التقدم التعليمي</p>
                <p>يمكن تتبع الشهادات والتقدم التعليمي السنوي والدورات الحالية من خلال واجهة إدارة الأطفال المنفصلة</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الجمعيات الخيرية الأخرى المسجلة فيها الحالة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Charity Section */}
          <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
            <h4 className="font-medium">إضافة جمعية خيرية</h4>

            {!showNewCharityForm ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اختر جمعية خيرية</Label>
                    <Select value={selectedCharityId} onValueChange={setSelectedCharityId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر جمعية خيرية موجودة" />
                      </SelectTrigger>
                      <SelectContent>
                        {charities
                          .filter(c => !caseCharities.some(cc => cc.charity_id === c.id))
                          .map((charity) => (
                            <SelectItem key={charity.id} value={charity.id}>
                              {charity.name_ar} {charity.name !== charity.name_ar ? `(${charity.name})` : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewCharityForm(true);
                        setSelectedCharityId("");
                      }}
                      className="flex-1"
                    >
                      إضافة جمعية جديدة
                    </Button>
                    <Button
                      type="button"
                      onClick={addCharity}
                      disabled={!selectedCharityId}
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم الجمعية (عربي) *</Label>
                    <Input
                      value={newCharityNameAr}
                      onChange={(e) => setNewCharityNameAr(e.target.value)}
                      placeholder="اسم الجمعية بالعربية"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>اسم الجمعية (إنجليزي) - اختياري</Label>
                    <Input
                      value={newCharityName}
                      onChange={(e) => setNewCharityName(e.target.value)}
                      placeholder="Charity Name (English)"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>المبلغ الشهري (جنيه)</Label>
                    <Input
                      type="number"
                      value={newCharityMonthlyAmount}
                      onChange={(e) => setNewCharityMonthlyAmount(Number(e.target.value))}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewCharityForm(false);
                        setNewCharityName("");
                        setNewCharityNameAr("");
                        setNewCharityMonthlyAmount(0);
                      }}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="button"
                      onClick={addCharity}
                      disabled={!newCharityNameAr.trim()}
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List of Case Charities */}
          {caseCharities.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">الجمعيات الخيرية المسجلة</h4>
              {caseCharities.map((caseCharity, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{caseCharity.charity_name_ar}</p>
                      {caseCharity.charity_name && caseCharity.charity_name !== caseCharity.charity_name_ar && (
                        <p className="text-sm text-muted-foreground">{caseCharity.charity_name}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCharity(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>المبلغ الشهري (جنيه)</Label>
                    <Input
                      type="number"
                      value={caseCharity.monthly_amount}
                      onChange={(e) => updateCharityMonthlyAmount(index, Number(e.target.value))}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {caseCharities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>لا توجد جمعيات خيرية مسجلة لهذه الحالة</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} size="lg">
          {loading
            ? (isEditMode ? "جار التحديث..." : "جار الحفظ...")
            : (isEditMode ? "تحديث الحالة" : "حفظ الحالة")
          }
        </Button>
      </div>
    </form>
  );
};

export default CaseForm;