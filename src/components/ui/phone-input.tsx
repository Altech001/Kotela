
'use client';

import * as React from 'react';
import {CheckIcon, ChevronsUpDown} from 'lucide-react';

import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {Input, type InputProps} from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {ScrollArea} from './scroll-area';

export type Country = {
  value: string;
  label: string;
  phone: string;
  code: string;
};

const COUNTRIES: Country[] = [
  { value: "AF", label: "Afghanistan", phone: "93", code: "AF" },
  { value: "AX", label: "Aland Islands", phone: "358", code: "AX" },
  { value: "AL", label: "Albania", phone: "355", code: "AL" },
  { value: "DZ", label: "Algeria", phone: "213", code: "DZ" },
  { value: "AS", label: "American Samoa", phone: "1-684", code: "AS" },
  { value: "AD", label: "Andorra", phone: "376", code: "AD" },
  { value: "AO", label: "Angola", phone: "244", code: "AO" },
  { value: "AI", label: "Anguilla", phone: "1-264", code: "AI" },
  { value: "AQ", label: "Antarctica", phone: "672", code: "AQ" },
  { value: "AG", label: "Antigua and Barbuda", phone: "1-268", code: "AG" },
  { value: "AR", label: "Argentina", phone: "54", code: "AR" },
  { value: "AM", label: "Armenia", phone: "374", code: "AM" },
  { value: "AW", label: "Aruba", phone: "297", code: "AW" },
  { value: "AU", label: "Australia", phone: "61", code: "AU" },
  { value: "AT", label: "Austria", phone: "43", code: "AT" },
  { value: "AZ", label: "Azerbaijan", phone: "994", code: "AZ" },
  { value: "BS", label: "Bahamas", phone: "1-242", code: "BS" },
  { value: "BH", label: "Bahrain", phone: "973", code: "BH" },
  { value: "BD", label: "Bangladesh", phone: "880", code: "BD" },
  { value: "BB", label: "Barbados", phone: "1-246", code: "BB" },
  { value: "BY", label: "Belarus", phone: "375", code: "BY" },
  { value: "BE", label: "Belgium", phone: "32", code: "BE" },
  { value: "BZ", label: "Belize", phone: "501", code: "BZ" },
  { value: "BJ", label: "Benin", phone: "229", code: "BJ" },
  { value: "BM", label: "Bermuda", phone: "1-441", code: "BM" },
  { value: "BT", label: "Bhutan", phone: "975", code: "BT" },
  { value: "BO", label: "Bolivia", phone: "591", code: "BO" },
  { value: "BA", label: "Bosnia and Herzegovina", phone: "387", code: "BA" },
  { value: "BW", label: "Botswana", phone: "267", code: "BW" },
  { value: "BR", label: "Brazil", phone: "55", code: "BR" },
  { value: "IO", label: "British Indian Ocean Territory", phone: "246", code: "IO" },
  { value: "BG", label: "Bulgaria", phone: "359", code: "BG" },
  { value: "BF", label: "Burkina Faso", phone: "226", code: "BF" },
  { value: "BI", label: "Burundi", phone: "257", code: "BI" },
  { value: "KH", label: "Cambodia", phone: "855", code: "KH" },
  { value: "CM", label: "Cameroon", phone: "237", code: "CM" },
  { value: "CA", label: "Canada", phone: "1", code: "CA" },
  { value: "CV", label: "Cape Verde", phone: "238", code: "CV" },
  { value: "KY", label: "Cayman Islands", phone: "1-345", code: "KY" },
  { value: "CF", label: "Central African Republic", phone: "236", code: "CF" },
  { value: "TD", label: "Chad", phone: "235", code: "TD" },
  { value: "CL", label: "Chile", phone: "56", code: "CL" },
  { value: "CN", label: "China", phone: "86", code: "CN" },
  { value: "CX", label: "Christmas Island", phone: "61", code: "CX" },
  { value: "CC", label: "Cocos (Keeling) Islands", phone: "61", code: "CC" },
  { value: "CO", label: "Colombia", phone: "57", code: "CO" },
  { value: "KM", label: "Comoros", phone: "269", code: "KM" },
  { value: "CG", label: "Congo", phone: "242", code: "CG" },
  { value: "CD", label: "Congo, The Democratic Republic of the", phone: "243", code: "CD" },
  { value: "CK", label: "Cook Islands", phone: "682", code: "CK" },
  { value: "CR", label: "Costa Rica", phone: "506", code: "CR" },
  { value: "CI", label: "Cote d'Ivoire", phone: "225", code: "CI" },
  { value: "HR", label: "Croatia", phone: "385", code: "HR" },
  { value: "CU", label: "Cuba", phone: "53", code: "CU" },
  { value: "CY", label: "Cyprus", phone: "357", code: "CY" },
  { value: "CZ", label: "Czech Republic", phone: "420", code: "CZ" },
  { value: "DK", label: "Denmark", phone: "45", code: "DK" },
  { value: "DJ", label: "Djibouti", phone: "253", code: "DJ" },
  { value: "DM", label: "Dominica", phone: "1-767", code: "DM" },
  { value: "DO", label: "Dominican Republic", phone: "1-809", code: "DO" },
  { value: "EC", label: "Ecuador", phone: "593", code: "EC" },
  { value: "EG", label: "Egypt", phone: "20", code: "EG" },
  { value: "SV", label: "El Salvador", phone: "503", code: "SV" },
  { value: "GQ", label: "Equatorial Guinea", phone: "240", code: "GQ" },
  { value: "ER", label: "Eritrea", phone: "291", code: "ER" },
  { value: "EE", label: "Estonia", phone: "372", code: "EE" },
  { value: "ET", label: "Ethiopia", phone: "251", code: "ET" },
  { value: "FK", label: "Falkland Islands (Malvinas)", phone: "500", code: "FK" },
  { value: "FO", label: "Faroe Islands", phone: "298", code: "FO" },
  { value: "FJ", label: "Fiji", phone: "679", code: "FJ" },
  { value: "FI", label: "Finland", phone: "358", code: "FI" },
  { value: "FR", label: "France", phone: "33", code: "FR" },
  { value: "GF", label: "French Guiana", phone: "594", code: "GF" },
  { value: "PF", label: "French Polynesia", phone: "689", code: "PF" },
  { value: "GA", label: "Gabon", phone: "241", code: "GA" },
  { value: "GM", label: "Gambia", phone: "220", code: "GM" },
  { value: "GE", label: "Georgia", phone: "995", code: "GE" },
  { value: "DE", label: "Germany", phone: "49", code: "DE" },
  { value: "GH", label: "Ghana", phone: "233", code: "GH" },
  { value: "GI", label: "Gibraltar", phone: "350", code: "GI" },
  { value: "GR", label: "Greece", phone: "30", code: "GR" },
  { value: "GL", label: "Greenland", phone: "299", code: "GL" },
  { value: "GD", label: "Grenada", phone: "1-473", code: "GD" },
  { value: "GP", label: "Guadeloupe", phone: "590", code: "GP" },
  { value: "GU", label: "Guam", phone: "1-671", code: "GU" },
  { value: "GT", label: "Guatemala", phone: "502", code: "GT" },
  { value: "GG", label: "Guernsey", phone: "44", code: "GG" },
  { value: "GN", label: "Guinea", phone: "224", code: "GN" },
  { value: "GW", label: "Guinea-Bissau", phone: "245", code: "GW" },
  { value: "GY", label: "Guyana", phone: "592", code: "GY" },
  { value: "HT", label: "Haiti", phone: "509", code: "HT" },
  { value: "HN", label: "Honduras", phone: "504", code: "HN" },
  { value: "HK", label: "Hong Kong", phone: "852", code: "HK" },
  { value: "HU", label: "Hungary", phone: "36", code: "HU" },
  { value: "IS", label: "Iceland", phone: "354", code: "IS" },
  { value: "IN", label: "India", phone: "91", code: "IN" },
  { value: "ID", label: "Indonesia", phone: "62", code: "ID" },
  { value: "IR", label: "Iran, Islamic Republic of", phone: "98", code: "IR" },
  { value: "IQ", label: "Iraq", phone: "964", code: "IQ" },
  { value: "IE", label: "Ireland", phone: "353", code: "IE" },
  { value: "IM", label: "Isle of Man", phone: "44", code: "IM" },
  { value: "IL", label: "Israel", phone: "972", code: "IL" },
  { value: "IT", label: "Italy", phone: "39", code: "IT" },
  { value: "JM", label: "Jamaica", phone: "1-876", code: "JM" },
  { value: "JP", label: "Japan", phone: "81", code: "JP" },
  { value: "JE", label: "Jersey", phone: "44", code: "JE" },
  { value: "JO", label: "Jordan", phone: "962", code: "JO" },
  { value: "KZ", label: "Kazakhstan", phone: "7", code: "KZ" },
  { value: "KE", label: "Kenya", phone: "254", code: "KE" },
  { value: "KI", label: "Kiribati", phone: "686", code: "KI" },
  { value: "KP", label: "Korea, Democratic People's Republic of", phone: "850", code: "KP" },
  { value: "KR", label: "Korea, Republic of", phone: "82", code: "KR" },
  { value: "KW", label: "Kuwait", phone: "965", code: "KW" },
  { value: "KG", label: "Kyrgyzstan", phone: "996", code: "KG" },
  { value: "LA", label: "Lao People's Democratic Republic", phone: "856", code: "LA" },
  { value: "LV", label: "Latvia", phone: "371", code: "LV" },
  { value: "LB", label: "Lebanon", phone: "961", code: "LB" },
  { value: "LS", label: "Lesotho", phone: "266", code: "LS" },
  { value: "LR", label: "Liberia", phone: "231", code: "LR" },
  { value: "LY", label: "Libyan Arab Jamahiriya", phone: "218", code: "LY" },
  { value: "LI", label: "Liechtenstein", phone: "423", code: "LI" },
  { value: "LT", label: "Lithuania", phone: "370", code: "LT" },
  { value: "LU", label: "Luxembourg", phone: "352", code: "LU" },
  { value: "MO", label: "Macao", phone: "853", code: "MO" },
  { value: "MK", label: "Macedonia, The Former Yugoslav Republic of", phone: "389", code: "MK" },
  { value: "MG", label: "Madagascar", phone: "261", code: "MG" },
  { value: "MW", label: "Malawi", phone: "265", code: "MW" },
  { value: "MY", label: "Malaysia", phone: "60", code: "MY" },
  { value: "MV", label: "Maldives", phone: "960", code: "MV" },
  { value: "ML", label: "Mali", phone: "223", code: "ML" },
  { value: "MT", label: "Malta", phone: "356", code: "MT" },
  { value: "MH", label: "Marshall Islands", phone: "692", code: "MH" },
  { value: "MQ", label: "Martinique", phone: "596", code: "MQ" },
  { value: "MR", label: "Mauritania", phone: "222", code: "MR" },
  { value: "MU", label: "Mauritius", phone: "230", code: "MU" },
  { value: "YT", label: "Mayotte", phone: "262", code: "YT" },
  { value: "MX", label: "Mexico", phone: "52", code: "MX" },
  { value: "FM", label: "Micronesia, Federated States of", phone: "691", code: "FM" },
  { value: "MD", label: "Moldova, Republic of", phone: "373", code: "MD" },
  { value: "MC", label: "Monaco", phone: "377", code: "MC" },
  { value: "MN", label: "Mongolia", phone: "976", code: "MN" },
  { value: "ME", label: "Montenegro", phone: "382", code: "ME" },
  { value: "MS", label: "Montserrat", phone: "1-664", code: "MS" },
  { value: "MA", label: "Morocco", phone: "212", code: "MA" },
  { value: "MZ", label: "Mozambique", phone: "258", code: "MZ" },
  { value: "MM", label: "Myanmar", phone: "95", code: "MM" },
  { value: "NA", label: "Namibia", phone: "264", code: "NA" },
  { value: "NR", label: "Nauru", phone: "674", code: "NR" },
  { value: "NP", label: "Nepal", phone: "977", code: "NP" },
  { value: "NL", label: "Netherlands", phone: "31", code: "NL" },
  { value: "NC", label: "New Caledonia", phone: "687", code: "NC" },
  { value: "NZ", label: "New Zealand", phone: "64", code: "NZ" },
  { value: "NI", label: "Nicaragua", phone: "505", code: "NI" },
  { value: "NE", label: "Niger", phone: "227", code: "NE" },
  { value: "NG", label: "Nigeria", phone: "234", code: "NG" },
  { value: "NU", label: "Niue", phone: "683", code: "NU" },
  { value: "NF", label: "Norfolk Island", phone: "672", code: "NF" },
  { value: "MP", label: "Northern Mariana Islands", phone: "1-670", code: "MP" },
  { value: "NO", label: "Norway", phone: "47", code: "NO" },
  { value: "OM", label: "Oman", phone: "968", code: "OM" },
  { value: "PK", label: "Pakistan", phone: "92", code: "PK" },
  { value: "PW", label: "Palau", phone: "680", code: "PW" },
  { value: "PS", label: "Palestinian Territory, Occupied", phone: "970", code: "PS" },
  { value: "PA", label: "Panama", phone: "507", code: "PA" },
  { value: "PG", label: "Papua New Guinea", phone: "675", code: "PG" },
  { value: "PY", label: "Paraguay", phone: "595", code: "PY" },
  { value: "PE", label: "Peru", phone: "51", code: "PE" },
  { value: "PH", label: "Philippines", phone: "63", code: "PH" },
  { value: "PL", label: "Poland", phone: "48", code: "PL" },
  { value: "PT", label: "Portugal", phone: "351", code: "PT" },
  { value: "PR", label: "Puerto Rico", phone: "1", code: "PR" },
  { value: "QA", label: "Qatar", phone: "974", code: "QA" },
  { value: "RO", label: "Romania", phone: "40", code: "RO" },
  { value: "RU", label: "Russian Federation", phone: "7", code: "RU" },
  { value: "RW", label: "Rwanda", phone: "250", code: "RW" },
  { value: "BL", label: "Saint Barthelemy", phone: "590", code: "BL" },
  { value: "SH", label: "Saint Helena", phone: "290", code: "SH" },
  { value: "KN", label: "Saint Kitts and Nevis", phone: "1-869", code: "KN" },
  { value: "LC", label: "Saint Lucia", phone: "1-758", code: "LC" },
  { value: "MF", label: "Saint Martin", phone: "590", code: "MF" },
  { value: "PM", label: "Saint Pierre and Miquelon", phone: "508", code: "PM" },
  { value: "VC", label: "Saint Vincent and the Grenadines", phone: "1-784", code: "VC" },
  { value: "WS", label: "Samoa", phone: "685", code: "WS" },
  { value: "SM", label: "San Marino", phone: "378", code: "SM" },
  { value: "ST", label: "Sao Tome and Principe", phone: "239", code: "ST" },
  { value: "SA", label: "Saudi Arabia", phone: "966", code: "SA" },
  { value: "SN", label: "Senegal", phone: "221", code: "SN" },
  { value: "RS", label: "Serbia", phone: "381", code: "RS" },
  { value: "SC", label: "Seychelles", phone: "248", code: "SC" },
  { value: "SL", label: "Sierra Leone", phone: "232", code: "SL" },
  { value: "SG", label: "Singapore", phone: "65", code: "SG" },
  { value: "SK", label: "Slovakia", phone: "421", code: "SK" },
  { value: "SI", label: "Slovenia", phone: "386", code: "SI" },
  { value: "SB", label: "Solomon Islands", phone: "677", code: "SB" },
  { value: "SO", label: "Somalia", phone: "252", code: "SO" },
  { value: "ZA", label: "South Africa", phone: "27", code: "ZA" },
  { value: "GS", label: "South Georgia and the South Sandwich Islands", phone: "500", code: "GS" },
  { value: "ES", label: "Spain", phone: "34", code: "ES" },
  { value: "LK", label: "Sri Lanka", phone: "94", code: "LK" },
  { value: "SD", label: "Sudan", phone: "249", code: "SD" },
  { value: "SR", label: "Suriname", phone: "597", code: "SR" },
  { value: "SZ", label: "Swaziland", phone: "268", code: "SZ" },
  { value: "SE", label: "Sweden", phone: "46", code: "SE" },
  { value: "CH", label: "Switzerland", phone: "41", code: "CH" },
  { value: "SY", label: "Syrian Arab Republic", phone: "963", code: "SY" },
  { value: "TW", label: "Taiwan, Province of China", phone: "886", code: "TW" },
  { value: "TJ", label: "Tajikistan", phone: "992", code: "TJ" },
  { value: "TZ", label: "Tanzania, United Republic of", phone: "255", code: "TZ" },
  { value: "TH", label: "Thailand", phone: "66", code: "TH" },
  { value: "TL", label: "Timor-Leste", phone: "670", code: "TL" },
  { value: "TG", label: "Togo", phone: "228", code: "TG" },
  { value: "TK", label: "Tokelau", phone: "690", code: "TK" },
  { value: "TO", label: "Tonga", phone: "676", code: "TO" },
  { value: "TT", label: "Trinidad and Tobago", phone: "1-868", code: "TT" },
  { value: "TN", label: "Tunisia", phone: "216", code: "TN" },
  { value: "TR", label: "Turkey", phone: "90", code: "TR" },
  { value: "TM", label: "Turkmenistan", phone: "993", code: "TM" },
  { value: "TC", label: "Turks and Caicos Islands", phone: "1-649", code: "TC" },
  { value: "TV", label: "Tuvalu", phone: "688", code: "TV" },
  { value: "UG", label: "Uganda", phone: "256", code: "UG" },
  { value: "UA", label: "Ukraine", phone: "380", code: "UA" },
  { value: "AE", label: "United Arab Emirates", phone: "971", code: "AE" },
  { value: "GB", label: "United Kingdom", phone: "44", code: "GB" },
  { value: "US", label: "United States", phone: "1", code: "US" },
  { value: "UY", label: "Uruguay", phone: "598", code: "UY" },
  { value: "UZ", label: "Uzbekistan", phone: "998", code: "UZ" },
  { value: "VU", label: "Vanuatu", phone: "678", code: "VU" },
  { value: "VE", label: "Venezuela", phone: "58", code: "VE" },
  { value: "VN", label: "Viet Nam", phone: "84", code: "VN" },
  { value: "VG", label: "Virgin Islands, British", phone: "1-284", code: "VG" },
  { value: "VI", label: "Virgin Islands, U.S.", phone: "1-340", code: "VI" },
  { value: "WF", label: "Wallis and Futuna", phone: "681", code: "WF" },
  { value: "YE", label: "Yemen", phone: "967", code: "YE" },
  { value: "ZM", label: "Zambia", phone: "260", code: "ZM" },
  { value: "ZW", label: "Zimbabwe", phone: "263", code: "ZW" },
];

type PhoneInputProps = Omit<InputProps, 'onChange' | 'value'> & {
  value?: string;
  onChange: (value: string) => void;
  country: Country['value'];
  onCountryChange: (value: Country['value']) => void;
};

const PhoneInput: React.FC<PhoneInputProps> = ({
  value = '',
  onChange,
  country,
  onCountryChange,
  ...rest
}) => {
  const [open, setOpen] = React.useState(false);
  const selectedCountry = COUNTRIES.find(c => c.value === country);

  const handlePhoneNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    if (value.match(/^[0-9\s()+-]*$/)) {
      onChange(value);
    }
  };

  return (
    <div className="flex">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[150px] justify-between rounded-r-none"
          >
            {selectedCountry
              ? `${selectedCountry.label} (+${selectedCountry.phone})`
              : 'Select country'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search country..." />
            <CommandEmpty>No country found.</CommandEmpty>
            <ScrollArea className="h-64">
              <CommandList>
                {COUNTRIES.map(c => (
                  <CommandItem
                    key={c.value}
                    value={c.value}
                    onSelect={currentValue => {
                      onCountryChange(currentValue.toUpperCase());
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'mr-2 h-4 w-4',
                        country === c.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {c.label} (+{c.phone})
                  </CommandItem>
                ))}
              </CommandList>
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        {...rest}
        value={value}
        onChange={handlePhoneNumberChange}
        className="rounded-l-none"
        placeholder="Phone number"
      />
    </div>
  );
};

export {PhoneInput};
