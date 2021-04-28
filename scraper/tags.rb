#!/usr/bin/env ruby

require 'yaml'

require File.join(__dir__, 'lib/tools')

counter = 1
debug = false

config = YAML.load_file("config.yml")

tools = Tools.new

files = Dir.glob("../_posts/*-focus_*.md")
files = Dir.glob("../_posts/*.md")

files.each do |filename|

  meta_data = YAML.load_file(filename)

  if !meta_data['redirect']
    puts "no redirect found"
    next
  end

  file = File.open(filename)
  file_data = file.read
  file_data = file_data.gsub!(/\A---(.|\n)*?---/, '')
  file_data = file_data.gsub(/\n+|\r+/, "\n").squeeze("\n").strip

  file_name = filename.split('/').last
  meta_data['filename'] = File.basename(file_name,File.extname(file_name))

  domain = tools.get_sitename(meta_data['redirect'], debug)

  if config['category'][domain] and !meta_data['categories'].include?(config['category'][domain])
    puts "File: #{filename} (#{counter})"
    puts "#{config['category'][domain]} not found"
    meta_data['categories'].push(config['category'][domain])
  end

#  if meta_data['tags'].length == 1
#    puts "File: #{filename} (#{counter})"
#    puts "just 1 tag"
#    counter += 1
#  end

#  if meta_data['categories'].length == 1
#    puts "File: #{filename} (#{counter})"
#    puts "just 1 category"
#    counter += 1
#  end

  #if meta_data['categories'].include?("Manipulation") and meta_data['categories'].length == 1
  #  puts "File: #{filename} (#{counter})"
  #  counter += 1
  #end

  if meta_data['categories'].include?("Manipulation")
    puts "File: #{filename} (#{counter})"
    puts meta_data['categories']
    meta_data['categories'].delete_at(meta_data['categories'].index("Manipulation"))
    puts meta_data['categories']
    puts meta_data['tags']
    meta_data['tags'].push("manipulation")
    puts meta_data['tags']
    counter += 1
  end

  if file_data != ""
    tools.write_file(meta_data, false, file_data)
  else
    tools.write_file(meta_data, false, false)
  end

end
