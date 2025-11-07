import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: any;
  default_value?: string;
}

interface FormFieldProps {
  field: Field;
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
}

export const FormField = ({ field, value, onChange, disabled }: FormFieldProps) => {
  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "number":
      case "tel":
      case "url":
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            required={field.required}
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            required={field.required}
            rows={4}
          />
        );

      case "select":
        const selectOptions = Array.isArray(field.options) ? field.options : [];
        return (
          <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option: string, idx: number) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        const radioOptions = Array.isArray(field.options) ? field.options : [];
        return (
          <RadioGroup value={value || ""} onValueChange={onChange} disabled={disabled}>
            {radioOptions.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        const checkboxOptions = Array.isArray(field.options) ? field.options : [];
        const checkedValues = Array.isArray(value) ? value : [];
        
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${idx}`}
                  checked={checkedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange?.([...checkedValues, option]);
                    } else {
                      onChange?.(checkedValues.filter((v: string) => v !== option));
                    }
                  }}
                  disabled={disabled}
                />
                <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
                disabled={disabled}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange?.(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return <Input value={value || ""} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} />;
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
    </div>
  );
};
