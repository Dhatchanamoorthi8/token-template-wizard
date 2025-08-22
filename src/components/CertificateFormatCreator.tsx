
import React, { useState, useEffect, useMemo, useContext } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, X, FileText, Settings, Eye, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import DraggableToken from "./DraggableToken";
import DropTargetArea from "./DropTargetArea";
import { showSwal } from "./ui/swal-config";

// Mock config and auth context - replace with your actual implementations
const config = {
  Calibmaster: {
    URL: process.env.REACT_APP_API_URL || "http://localhost:3001"
  }
};

const AuthContext = React.createContext({
  token: "mock-token"
});

const CertificateFormatCreator = () => {
  const auth = useContext(AuthContext);
  const [formatTemplate, setFormatTemplate] = useState("");
  const [preview, setPreview] = useState("");
  const [extraFields, setExtraFields] = useState<string[]>([]);
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [labs, setLabs] = useState<Array<{value: string, label: string}>>([]);
  const [labId, setLabId] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const staticTokens = [
    "labCode",
    "labType", 
    "year",
    "yearRange",
    "srf",
    "itemCount",
    "month",
    "monthCustomer",
    "RunningNo"
  ];

  const defaultValues = () => {
    const now = new Date();
    const currentYear = parseInt("2025") || now.getFullYear();
    const yearShort = currentYear.toString().slice(-2);

    return {
      labCode: "",
      labType: "",
      year: yearShort,
      yearRange: "",
      month: "",
      srf: `{{SRF}}`,
      itemCount: `{{ItemCount}}`,
      monthCustomer: `{{MonthCustomer}}`,
      ...extraValues,
    };
  };

  const replaceTemplate = (template: string, data: Record<string, string>) =>
    template.replace(/{{(.*?)}}/g, (_, key) => data[key] ?? `{{${key}}}`);

  useEffect(() => {
    const dummy = defaultValues();
    setPreview(replaceTemplate(formatTemplate, dummy));
  }, [formatTemplate, extraValues]);

  const fetchExisting = async (id: string) => {
    if (!id) {
      setFormatTemplate("");
      setPreview("");
      setExtraFields([]);
      setExtraValues({});
      setIsEdit(false);
      return;
    }
    
    try {
      const response = await fetch(
        `${config.Calibmaster.URL}/api/certificate-format/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
        }
      );

      const res = await response.json();
      if (res) {
        setFormatTemplate(res.format_template || "");
        setExtraFields(res.required_fields.map((f: any) => f.name));
        setPreview(res.preview);
        const mapValues: Record<string, string> = {};
        res.required_fields.forEach((f: any) => (mapValues[f.name] = f.value));
        setExtraValues(mapValues);
        setIsEdit(true);
      }
    } catch (err) {
      console.log("No existing format");
    }
  };

  useEffect(() => {
    fetchExisting(labId);
  }, [labId]);

  const handleSave = async () => {
    if (!labId || !formatTemplate) {
      alert("Fill in all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      const allTokens = Array.from(
        new Set(
          (formatTemplate.match(/{{(.*?)}}/g) || []).map((m) =>
            m.replace(/[{}]/g, "")
          )
        )
      );

      const fields = allTokens.map((key) => ({
        name: key,
        value: extraValues[key] || "",
      }));

      const allData = {
        labId,
        formatTemplate,
        requiredFields: fields,
        preview,
      };

      const response = await fetch(
        `${config.Calibmaster.URL}/api/certificate-format/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
          body: JSON.stringify(allData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        await showSwal({
          icon: 'success',
          title: 'Success!',
          text: result.message || "Format saved successfully!",
        });
      } else {
        await showSwal({
          icon: 'error',
          title: 'Error',
          text: result.message || "Error saving format.",
        });
      }
    } catch (err) {
      console.error(err);
      await showSwal({
        icon: 'error',
        title: 'Error',
        text: "Error saving format.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const promptTokenInput = async (token: string) => {
    if (token === "labType") {
      const { value: selected } = await showSwal({
        title: `Select value for '{{${token}}}'`,
        input: "select",
        inputOptions: {
          CAL: "CAL",
          TEST: "TEST",
        },
        inputPlaceholder: "Select lab type",
        showCancelButton: true,
      });
      return selected || null;
    }

    if (token === "year") {
      const years = Array.from({ length: 6 }, (_, i) => 2022 + i);
      const yearOptions: Record<string, string> = {};
      years.forEach((year) => {
        yearOptions[year.toString()] = `${year} (full)`;
        yearOptions[year.toString().slice(-2)] = `${year
          .toString()
          .slice(-2)} (short)`;
      });

      const { value: selected } = await showSwal({
        title: `Select year for '{{${token}}}'`,
        input: "select",
        inputOptions: yearOptions,
        inputPlaceholder: "Select year format",
        showCancelButton: true,
      });
      return selected || null;
    }

    if (["srf", "itemCount", "monthCustomer"].includes(token)) {
      return defaultValues()[token as keyof ReturnType<typeof defaultValues>] ?? `{{${token}}}`;
    }

    const { value: result } = await showSwal({
      title: `Enter value for '{{${token}}}'`,
      input: "text",
      inputPlaceholder: `Enter ${token} value`,
      showCancelButton: true,
    });
    return result || null;
  };

  const onTokenDrop = async (token: string) => {
    const value = await promptTokenInput(token);
    if (value === null) return null;
    setExtraValues((prev) => ({ ...prev, [token]: value }));
    return value;
  };

  const addExtraField = async () => {
    const { value: token } = await showSwal({
      title: "Create New Field",
      text: "Enter a unique field name for your certificate template",
      input: "text",
      inputPlaceholder: "e.g., batchCode, serialNumber",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Field name is required!';
        }
        if (staticTokens.includes(value) || extraFields.includes(value)) {
          return 'Field name already exists!';
        }
        return null;
      }
    });

    if (!token || !token.trim()) return;

    setExtraFields((prev) => [...prev, token]);
    setExtraValues((prev) => ({ ...prev, [token]: "" }));
  };

  const removeExtraField = (key: string) => {
    setExtraFields((prev) => prev.filter((k) => k !== key));
    setExtraValues((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setFormatTemplate((prev) => {
      // Replace replaceAll with regex-based replace for compatibility
      const updated = prev.replace(new RegExp(`{{${key}}}`, 'g'), "");
      return updated;
    });
  };

  const tokenList = useMemo(() => {
    return [...staticTokens, ...extraFields];
  }, [extraFields]);

  const disabledTokens = useMemo(() => {
    return tokenList.filter((token) => formatTemplate.includes(`{{${token}}}`));
  }, [formatTemplate, tokenList]);

  const fetchConfig = async () => {
    try {
      const response = await fetch(
        config.Calibmaster.URL + "/api/cms-setting/fetch-cms-certificate",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth.token,
          },
        }
      );

      const result = await response.json();
      if (result?.result?.length > 0) {
        const { labList } = result;
        const newArray = [{ value: "", label: "Select Lab" }];
        labList.forEach((item: any, index: number) => {
          newArray[index + 1] = {
            value: item.lab_id,
            label: item.lab_name,
          };
        });
        setLabs(newArray);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const hasValidFields = Object.values(extraValues).some(
    (val) => val !== null && val !== undefined && val !== ""
  );

  const disableList = ["srf", "itemCount", "monthCustomer"];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <FileText className="w-4 h-4" />
              Certificate Builder
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Certificate Format Creator</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Design and customize certificate numbering formats with drag-and-drop tokens
            </p>
          </div>

          {/* Lab Selection */}
          <Card className="card-gradient shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Laboratory Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="lab-select">Select Laboratory</Label>
                <Select value={labId} onValueChange={setLabId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a laboratory" />
                  </SelectTrigger>
                  <SelectContent>
                    {labs.map((lab) => (
                      <SelectItem key={lab.value} value={lab.value}>
                        {lab.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Available Tokens */}
          <Card className="card-gradient shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {tokenList.length} Available
                  </Badge>
                  Token Library
                </div>
                <Button
                  onClick={addExtraField}
                  size="sm"
                  className="h-8 w-8 p-0"
                  title="Add Custom Field"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tokenList.map((token) => (
                  <DraggableToken
                    key={token}
                    token={token}
                    disabled={disabledTokens.includes(token)}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                💡 Drag tokens to the template area below or type manually using {`{{tokenName}}`} format
              </p>
            </CardContent>
          </Card>

          {/* Template Builder */}
          <Card className="card-gradient shadow-lg border-0">
            <CardHeader>
              <CardTitle>Certificate Template</CardTitle>
            </CardHeader>
            <CardContent>
              <DropTargetArea
                template={formatTemplate}
                setTemplate={setFormatTemplate}
                onTokenDrop={onTokenDrop}
              />
            </CardContent>
          </Card>

          {/* Field Editor */}
          {hasValidFields && isEdit && (
            <Card className="card-gradient shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Field Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(extraValues).map((field) => (
                  <div key={field} className="field-container">
                    <div className="flex-1">
                      <Label htmlFor={`field-${field}`} className="text-sm font-medium mb-1 block">
                        {`{{${field}}}`}
                      </Label>
                      <Input
                        id={`field-${field}`}
                        value={extraValues[field] || ""}
                        onChange={(e) =>
                          setExtraValues({ ...extraValues, [field]: e.target.value })
                        }
                        disabled={disableList.includes(field)}
                        placeholder={`Enter value for ${field}`}
                      />
                    </div>
                    {!disableList.includes(field) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeExtraField(field)}
                        className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove Field"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Preview & Save */}
          <Card className="card-gradient shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview & Save
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="preview-card">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Certificate Number Preview
                </h4>
                <div className="text-2xl font-bold font-mono text-primary mb-3">
                  {preview || "No preview available"}
                </div>
                <Separator className="my-4" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Template:</strong> <code className="bg-muted px-1 py-0.5 rounded">{formatTemplate || "..."}</code></p>
                </div>
              </div>
              
              <Button
                onClick={handleSave}
                disabled={isLoading || !labId || !formatTemplate}
                className="w-full certificate-gradient hover:opacity-90 transition-all duration-200"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? "Saving..." : "Save Certificate Format"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DndProvider>
  );
};

export default CertificateFormatCreator;
